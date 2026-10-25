import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { allowedEmails, parseEnv } from "@/lib/env";
import { canSignIn } from "./policy";
const env=parseEnv(process.env); const providers:Provider[]=[Google({clientId:env.AUTH_GOOGLE_ID??"not-configured",clientSecret:env.AUTH_GOOGLE_SECRET??"not-configured"})];
if(env.E2E_TEST_MODE==="true"&&!env.VERCEL) providers.push(Credentials({name:"Pruebas locales",credentials:{email:{}},authorize:async credentials=>{const email=String(credentials.email??"").toLowerCase(); if(!allowedEmails(env).has(email))return null; return {id:email==="tomasgz2006@gmail.com"?"00000000-0000-4000-8000-000000000001":"00000000-0000-4000-8000-000000000002",email,name:"Usuario de prueba"};}}));
export const {handlers,auth,signIn,signOut}=NextAuth({providers,session:{strategy:"jwt"},pages:{signIn:"/login",error:"/login"},callbacks:{async signIn({profile,user,account}){if(account?.provider==="credentials")return env.E2E_TEST_MODE==="true"&&!env.VERCEL; return canSignIn({email:user.email,email_verified:(profile as {email_verified?:boolean}|undefined)?.email_verified,sub:account?.providerAccountId},allowedEmails(env));},jwt({token,user}){if(user?.id)token.userId=user.id; return token;},session({session,token}){if(session.user)session.user.id=String(token.userId??token.sub??"");return session;}}});
