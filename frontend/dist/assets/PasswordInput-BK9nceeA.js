import{a as u}from"./axios-BxwilOnN.js";import{c as m}from"./createLucideIcon-DQPDRbx6.js";import{j as e,r as j}from"./index-D7i4SO6s.js";import{T as y}from"./truck-Dg56PXA2.js";import{E as w}from"./eye-uevHBEx-.js";const A=async(r,s)=>(await u.post("/auth/login",{email:r,password:s})).data,E=async(r,s,a,o)=>(await u.post("/auth/register",{full_name:r,email:s,password:a,role:o})).data,$=async r=>(await u.post("/auth/forgot-password",{email:r})).data;/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=m("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=m("EyeOff",[["path",{d:"M9.88 9.88a3 3 0 1 0 4.24 4.24",key:"1jxqfv"}],["path",{d:"M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68",key:"9wicm4"}],["path",{d:"M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61",key:"1jreej"}],["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}]]);/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=m("Loader2",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);function F({label:r,type:s="text",value:a,onChange:o,onBlur:n,error:l,placeholder:x,rightIcon:d,inputRef:c}){return e.jsxs("div",{children:[e.jsx("label",{className:"block text-gray-300 text-sm font-medium mb-1",children:r}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{ref:c,type:s,value:a,onChange:o,onBlur:n,placeholder:x,className:`w-full h-11 px-4 bg-[#0D1117] text-white border rounded-lg transition-all duration-200 placeholder-gray-500 focus:outline-none ${l?"border-red-400 focus:border-red-400 focus:ring-0":"border-[#30363D] focus:border-green-400 focus:ring-0"}`,style:{boxShadow:l?"none":"0 0 0 3px rgba(74,222,128,0.1)"}}),d&&e.jsx("div",{className:"absolute right-3 top-1/2 -translate-y-1/2",children:d})]}),l&&e.jsx("p",{className:"text-red-400 text-xs mt-1",children:l})]})}function z({title:r,subtitle:s,className:a="",children:o}){const n=a.includes("max-w-")?a:`max-w-[440px] ${a}`;return e.jsxs("div",{className:`relative w-full animate-card-enter ${n}`.trim(),children:[e.jsxs("div",{className:"bg-[#161B22] border border-[#30363D] rounded-2xl p-10 shadow-2xl",children:[e.jsxs("div",{className:"text-center mb-8",children:[e.jsxs("div",{className:"flex items-center justify-center gap-2 mb-1",children:[e.jsx(y,{className:"w-5 h-5 text-green-400"}),e.jsx("span",{className:"text-2xl font-bold text-white",children:"Fleet"}),e.jsx("span",{className:"text-2xl font-bold text-green-400",children:"Flow"})]}),e.jsx("p",{className:"text-gray-400 text-sm mt-1",children:s})]}),o]}),e.jsx("style",{children:`
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
      `})]})}function I({label:r,value:s,onChange:a,onBlur:o,error:n,placeholder:l,showStrengthBar:x=!1,inputRef:d}){const[c,h]=j.useState(!1),i=(t=>{if(t.length===0)return 0;if(t.length<6)return 1;const p=/[0-9]/.test(t),b=/[^A-Za-z0-9]/.test(t);return t.length>=8&&p&&b?3:2})(s),f=t=>t===1?"bg-red-500":t===2?"bg-yellow-500":t===3?"bg-green-500":"bg-[#30363D]",g=t=>t===1?"text-red-400":t===2?"text-yellow-400":t===3?"text-green-400":"";return e.jsxs("div",{children:[e.jsx("label",{className:"block text-gray-300 text-sm font-medium mb-1",children:r}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{ref:d,type:c?"text":"password",value:s,onChange:a,onBlur:o,placeholder:l,className:`w-full h-11 px-4 pr-12 bg-[#0D1117] text-white border rounded-lg transition-all duration-200 placeholder-gray-500 focus:outline-none ${n?"border-red-400 focus:border-red-400 focus:ring-0":"border-[#30363D] focus:border-green-400 focus:ring-0"}`,style:{boxShadow:n?"none":"0 0 0 3px rgba(74,222,128,0.1)"}}),e.jsx("button",{type:"button",onClick:()=>h(!c),className:"absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors",children:c?e.jsx(N,{className:"w-5 h-5"}):e.jsx(w,{className:"w-5 h-5"})})]}),x&&s.length>0&&e.jsxs("div",{className:"mt-2",children:[e.jsx("div",{className:"flex gap-1",children:[1,2,3].map(t=>e.jsx("div",{className:`h-1 flex-1 rounded-full transition-all duration-300 ${t<=i?f(i):"bg-[#30363D]"}`},t))}),e.jsxs("span",{className:`text-xs mt-1 inline-block ${g(i)}`,children:[i===1&&"Weak",i===2&&"Fair",i===3&&"Strong"]})]}),n&&e.jsx("p",{className:"text-red-400 text-xs mt-1",children:n})]})}export{z as A,L as C,M as L,I as P,F as a,$ as f,A as l,E as r};
