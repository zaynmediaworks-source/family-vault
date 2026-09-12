'use client';
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import Link from 'next/link';
export default function FeedbackNavLink(){const[node,setNode]=useState<HTMLElement|null>(null);useEffect(()=>{const host=document.querySelector('.refined-sidebar .side-bottom') as HTMLElement|null;if(!host)return;let n=document.getElementById('feedback-nav-portal');if(!n){n=document.createElement('div');n.id='feedback-nav-portal';host.insertBefore(n,host.firstChild)}setNode(n);return()=>n?.remove()},[]);return node?createPortal(<Link href="/feedback">💬 Saran & Kritik</Link>,node):null}
