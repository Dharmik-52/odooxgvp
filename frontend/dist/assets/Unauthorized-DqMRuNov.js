import{u as n,a as c,j as e}from"./index-D7i4SO6s.js";import{c as t}from"./createLucideIcon-DQPDRbx6.js";/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=t("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=t("Home",[["path",{d:"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"y5dka4"}],["polyline",{points:"9 22 9 12 15 12 15 22",key:"e2us08"}]]);/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=t("XCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);function x(){const{role:r}=n(),s=c(),a=()=>({manager:"/dashboard",dispatcher:"/trips"})[r]||"/dashboard";return e.jsx("div",{className:"min-h-screen bg-[#0D1117] flex items-center justify-center p-4",children:e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"w-24 h-24 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center",children:e.jsx(l,{className:"w-12 h-12 text-red-400"})}),e.jsx("h1",{className:"text-3xl font-bold text-white mb-2",children:"Access Denied"}),e.jsx("p",{className:"text-gray-400 mb-8",children:"You don't have permission to view this page."}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-3 justify-center",children:[e.jsxs("button",{onClick:()=>s(-1),className:"inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#161B22] border border-[#30363D] text-white rounded-lg hover:bg-[#30363D] transition-colors",children:[e.jsx(o,{className:"w-5 h-5"}),"Go Back"]}),e.jsxs("button",{onClick:()=>s(a()),className:"inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors",children:[e.jsx(i,{className:"w-5 h-5"}),"Go to Dashboard"]})]})]})})}export{x as default};
