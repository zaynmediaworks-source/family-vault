'use client';

import {useEffect} from 'react';
import {supabase} from '@/lib/supabase';

type House={id:string;name:string};

const MAX_BYTES=5*1024*1024;
const ALLOWED=new Set(['image/jpeg','image/png','image/webp']);

export default function WishlistImageUploadEnhancer({houses}:{houses:House[]}){
  useEffect(()=>{
    let stopped=false;
    const houseIds=new Set(houses.map(h=>h.id));

    function selectedHouseId(){
      for(const node of Array.from(document.querySelectorAll('select')) as HTMLSelectElement[]){
        if(houseIds.has(node.value))return node.value;
      }
      return houses[0]?.id||'';
    }

    function setReactInputValue(input:HTMLInputElement,value:string){
      const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
      setter?.call(input,value);
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }

    function enhance(){
      if(stopped)return;
      const labels=Array.from(document.querySelectorAll('label')) as HTMLLabelElement[];
      for(const label of labels){
        if(label.dataset.fvWishlistUpload==='1')continue;
        const text=(label.childNodes[0]?.textContent||label.textContent||'').trim();
        if(!text.startsWith('Link gambar'))continue;
        const urlInput=label.querySelector('input') as HTMLInputElement|null;
        if(!urlInput)continue;

        label.dataset.fvWishlistUpload='1';
        label.style.display='none';

        const wrap=document.createElement('label');
        wrap.className=label.className;
        wrap.dataset.fvWishlistUploadUi='1';
        wrap.style.display='grid';
        wrap.style.gap='8px';
        wrap.textContent='Upload gambar barang';

        const file=document.createElement('input');
        file.type='file';
        file.accept='image/jpeg,image/png,image/webp';
        file.style.padding='10px';
        file.style.border='1px dashed rgba(70,110,105,.28)';
        file.style.borderRadius='12px';
        file.style.background='rgba(255,255,255,.55)';

        const hint=document.createElement('small');
        hint.className='muted';
        hint.textContent='JPG, PNG, atau WebP · maksimal 5 MB';

        const status=document.createElement('small');
        status.className='muted';

        const preview=document.createElement('img');
        preview.alt='Preview gambar wishlist';
        preview.style.display='none';
        preview.style.width='100%';
        preview.style.maxHeight='220px';
        preview.style.objectFit='cover';
        preview.style.borderRadius='14px';
        preview.style.border='1px solid rgba(70,110,105,.14)';

        let uploadedPath='';
        file.addEventListener('change',async()=>{
          const chosen=file.files?.[0];
          if(!chosen)return;
          status.textContent='';
          if(!ALLOWED.has(chosen.type)){
            status.textContent='Format gambar harus JPG, PNG, atau WebP.';
            file.value='';
            return;
          }
          if(chosen.size>MAX_BYTES){
            status.textContent='Ukuran gambar maksimal 5 MB.';
            file.value='';
            return;
          }
          const hid=selectedHouseId();
          if(!hid){status.textContent='Vault aktif tidak ditemukan.';return}
          const ext=chosen.type==='image/png'?'png':chosen.type==='image/webp'?'webp':'jpg';
          const path=`${hid}/${crypto.randomUUID()}.${ext}`;
          status.textContent='Mengupload gambar…';
          file.disabled=true;
          const up=await supabase.storage.from('wishlist-images').upload(path,chosen,{cacheControl:'3600',contentType:chosen.type,upsert:false});
          file.disabled=false;
          if(up.error){status.textContent=up.error.message;return}
          if(uploadedPath)void supabase.storage.from('wishlist-images').remove([uploadedPath]);
          uploadedPath=path;
          const {data}=supabase.storage.from('wishlist-images').getPublicUrl(path);
          setReactInputValue(urlInput,data.publicUrl);
          preview.src=URL.createObjectURL(chosen);
          preview.style.display='block';
          status.textContent='✓ Gambar siap disimpan bersama wishlist.';
        });

        wrap.append(file,hint,preview,status);
        label.insertAdjacentElement('afterend',wrap);
      }
    }

    enhance();
    const observer=new MutationObserver(enhance);
    observer.observe(document.body,{subtree:true,childList:true});
    return()=>{stopped=true;observer.disconnect()};
  },[houses]);

  return null;
}
