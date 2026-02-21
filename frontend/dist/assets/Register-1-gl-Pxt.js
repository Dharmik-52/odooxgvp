import{r as s,a as U,j as e,L as X,z as P}from"./index-D7i4SO6s.js";import{A as ee,a as E,P as A,C as te,L as se,r as re}from"./PasswordInput-BK9nceeA.js";import{c as ae}from"./createLucideIcon-DQPDRbx6.js";import{T as ne}from"./truck-Dg56PXA2.js";import"./axios-BxwilOnN.js";import"./eye-uevHBEx-.js";/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const le=ae("ShieldCheck",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]),I=[{value:"manager",label:"Manager",description:"Full system access",icon:le,iconColor:"text-green-400"},{value:"dispatcher",label:"Dispatcher",description:"Manage trips & vehicles",icon:ne,iconColor:"text-blue-400"}];function xe(){const[l,B]=s.useState(""),[o,D]=s.useState(""),[r,L]=s.useState(""),[n,R]=s.useState(""),[c,z]=s.useState(""),[x,F]=s.useState(!1),[Y,m]=s.useState(""),[T,i]=s.useState(""),[y,g]=s.useState(""),[M,j]=s.useState(""),[W,u]=s.useState(""),[k,f]=s.useState(""),[N,w]=s.useState(!1),[V,$]=s.useState(!1),[_,G]=s.useState(""),[S,J]=s.useState(""),Z=U(),p=t=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t),b=t=>t.length>=8&&/[0-9]/.test(t)&&/[^A-Za-z0-9]/.test(t);(t=>t.length===0?0:t.length<6?1:b(t)?3:2)(r);const q=async t=>{var h,C;t.preventDefault();let a=!1;if(l.trim().length<2?(m("Name must be at least 2 characters"),a=!0):m(""),p(o)?i(""):(i("Please enter a valid email address"),a=!0),c?g(""):(g("Please select a role"),a=!0),b(r)?j(""):(j("Password must be at least 8 characters with a number and special character"),a=!0),n&&n!==r?(u("Passwords do not match"),a=!0):u(""),x?f(""):(f("You must accept the terms to continue"),a=!0),!a){w(!0);try{const d=await re(l,o,r,c);G(d.full_name),J(d.role),$(!0)}catch(d){((h=d.response)==null?void 0:h.status)===409?i("An account with this email already exists"):((C=d.response)==null?void 0:C.status)===422?P.error("Please check your input and try again."):P.error("Server error. Please try again.")}finally{w(!1)}}},H=()=>{l&&l.trim().length<2?m("Name must be at least 2 characters"):m("")},K=()=>{o&&!p(o)?i("Please enter a valid email address"):i("")},O=()=>{u(n&&n!==r?"Passwords do not match":"")},v=I.find(t=>t.value===S||t.value===c),Q=l.trim().length>=2&&p(o)&&c&&b(r)&&r===n&&x;return V?e.jsxs("div",{className:"min-h-screen bg-[#0D1117] flex items-center justify-center p-4 relative overflow-hidden overflow-y-auto",children:[e.jsx("div",{className:"absolute inset-0",style:{backgroundImage:"radial-gradient(circle, #30363D 1px, transparent 1px)",backgroundSize:"24px 24px"}}),e.jsx("div",{className:"relative w-full max-w-[480px] animate-card-enter",children:e.jsxs("div",{className:"bg-[#161B22] border border-[#30363D] rounded-2xl p-10 shadow-2xl text-center",children:[e.jsx("div",{className:"mb-6",children:e.jsx("div",{className:"w-20 h-20 mx-auto rounded-full flex items-center justify-center animate-check-draw",children:e.jsxs("svg",{className:"w-20 h-20",viewBox:"0 0 52 52",children:[e.jsx("circle",{className:"check-circle-bg",cx:"26",cy:"26",r:"24",fill:"none",stroke:"#22c55e",strokeWidth:"2"}),e.jsx("path",{className:"check-mark",fill:"none",stroke:"#22c55e",strokeWidth:"3",strokeLinecap:"round",strokeLinejoin:"round",d:"M14.1 27.2l7.1 7.2 16.7-16.8"})]})})}),e.jsx("h2",{className:"text-2xl font-bold text-white mb-2",children:"Account Created!"}),e.jsxs("p",{className:"text-gray-400 text-sm mb-3",children:["Welcome to FleetFlow, ",_,"!"]}),e.jsx("div",{className:"inline-block px-4 py-1 bg-green-400/20 text-green-400 border border-green-400/30 rounded-full text-sm",children:(v==null?void 0:v.label)||S.replace("_"," ")}),e.jsx("button",{onClick:()=>Z("/login"),className:"w-full h-11 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-all duration-200 mt-8 flex items-center justify-center",children:"Go to Login"})]})}),e.jsx("style",{children:`
          @keyframes card-enter {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-card-enter {
            animation: card-enter 0.4s ease;
          }
          @keyframes check-draw {
            0% { stroke-dasharray: 0, 166; }
            100% { stroke-dasharray: 166, 0; }
          }
          .check-circle-bg {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            animation: check-draw 0.6s ease forwards;
          }
          .check-mark {
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: check-draw 0.3s ease 0.4s forwards;
          }
        `})]}):e.jsxs("div",{className:"min-h-screen bg-[#0D1117] flex items-center justify-center p-4 py-8 relative overflow-hidden overflow-y-auto",children:[e.jsx("div",{className:"absolute inset-0",style:{backgroundImage:"radial-gradient(circle, #30363D 1px, transparent 1px)",backgroundSize:"24px 24px"}}),e.jsx(ee,{subtitle:"Create your account",className:"max-w-[480px]",children:e.jsxs("form",{onSubmit:q,className:"space-y-5",children:[e.jsx(E,{label:"Full Name",type:"text",value:l,onChange:t=>B(t.target.value),onBlur:H,placeholder:"John Smith",error:Y}),e.jsx(E,{label:"Work Email",type:"email",value:o,onChange:t=>D(t.target.value),onBlur:K,placeholder:"you@company.com",error:T}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-gray-300 text-sm font-medium mb-2",children:"Select Your Role"}),e.jsx("div",{className:"grid grid-cols-2 gap-2",children:I.map(t=>{const a=t.icon,h=c===t.value;return e.jsx("button",{type:"button",onClick:()=>{z(t.value),g("")},className:`p-3 rounded-lg text-left transition-all duration-200 border ${h?"border-green-400 bg-green-400/10":"bg-[#0D1117] border-[#30363D] hover:border-gray-500"}`,children:e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(a,{className:`w-[18px] h-[18px] ${t.iconColor} mt-0.5`}),e.jsxs("div",{children:[e.jsx("p",{className:"text-white text-sm font-semibold",children:t.label}),e.jsx("p",{className:"text-gray-400 text-xs mt-0.5",children:t.description})]})]})},t.value)})}),y&&e.jsx("p",{className:"text-red-400 text-xs mt-1",children:y})]}),e.jsx(A,{label:"Password",value:r,onChange:t=>L(t.target.value),placeholder:"••••••••",error:M,showStrengthBar:!0}),e.jsx(A,{label:"Confirm Password",value:n,onChange:t=>R(t.target.value),onBlur:O,placeholder:"••••••••",error:W,showStrengthBar:!1,rightIcon:n&&r===n?e.jsx(te,{className:"w-5 h-5 text-green-400"}):null}),e.jsxs("div",{children:[e.jsxs("label",{className:"flex items-start gap-2 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:x,onChange:t=>{F(t.target.checked),t.target.checked&&f("")},className:"mt-0.5 w-4 h-4 rounded border-[#30363D] accent-green-400 bg-[#0D1117]"}),e.jsxs("span",{className:"text-gray-400 text-sm",children:["I agree to the"," ",e.jsx("span",{className:"text-green-400 hover:underline cursor-pointer",children:"Terms of Service"})," ","and"," ",e.jsx("span",{className:"text-green-400 hover:underline cursor-pointer",children:"Privacy Policy"})]})]}),k&&e.jsx("p",{className:"text-red-400 text-xs mt-1",children:k})]}),e.jsx("button",{type:"submit",disabled:!Q||N,className:"w-full h-11 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center",children:N?e.jsx(se,{className:"w-5 h-5 animate-spin border-2 border-black border-t-transparent rounded-full"}):"Create Account"}),e.jsxs("p",{className:"text-center text-gray-400 text-sm mt-4",children:["Already have an account?"," ",e.jsx(X,{to:"/login",className:"text-green-400 hover:text-green-300",children:"Sign In →"})]})]})}),e.jsx("style",{children:`
        @keyframes card-enter {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-card-enter {
          animation: card-enter 0.4s ease;
        }
      `})]})}export{xe as default};
