"use strict";(()=>{var e={};e.id=799,e.ids=[799],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},39491:e=>{e.exports=require("assert")},14300:e=>{e.exports=require("buffer")},6113:e=>{e.exports=require("crypto")},82361:e=>{e.exports=require("events")},13685:e=>{e.exports=require("http")},95687:e=>{e.exports=require("https")},63477:e=>{e.exports=require("querystring")},57310:e=>{e.exports=require("url")},73837:e=>{e.exports=require("util")},59796:e=>{e.exports=require("zlib")},85661:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>y,patchFetch:()=>k,requestAsyncStorage:()=>m,routeModule:()=>b,serverHooks:()=>v,staticGenerationAsyncStorage:()=>w});var o={};a.r(o),a.d(o,{GET:()=>u,runtime:()=>g});var i=a(49303),n=a(88716),r=a(60670),s=a(87070),l=a(75571),d=a(90455),c=a(85662);let p=["mon","tue","wed","thu","fri","sat","sun"],h={mon:"THỨ HAI",tue:"THỨ BA",wed:"THỨ TƯ",thu:"THỨ NĂM",fri:"THỨ S\xc1U",sat:"THỨ BẢY",sun:"CHỦ NHẬT"};async function x(e){var t,o;let i,n;try{i=a(Object(function(){var e=Error("Cannot find module 'html2pdf.js'");throw e.code="MODULE_NOT_FOUND",e}()))}catch(e){i=(await Promise.resolve().then(function(){var e=Error("Cannot find module 'html2pdf.js'");throw e.code="MODULE_NOT_FOUND",e})).default}let r=e.items.filter(e=>"observation"===e.category),s=(t=[...r,...e.items.filter(e=>"operation"===e.category)],o=r.length,n="",t.forEach((e,a)=>{let i=a<o,r=i?o:t.length-o,s=a%2==0?"white":"#f0f5ff";n+=`<tr style="background: ${s};">`,(i&&0===a||!i&&a===o)&&(n+=`<td rowspan="${r}" class="group-obs ${i?"":"group-op"}">${i?"Q.S":"V.H"}</td>`);let l=e.sub_label||e.label_vi;n+=`
      <td class="item-cell ${"white"!==s?"alt":""}">
        <div class="item-name">${f(l)}</div>
        <div class="item-desc">${f(e.label_en)}</div>
      </td>
    `,p.forEach(t=>{var a;let o=e.days?.[t]||{status:"",detail:""},i="pass"===o.status?"#f0fdf4":"fail"===o.status?"#fff1f2":s,r="pass"===o.status?"status-pass":"fail"===o.status?"status-fail":"";n+=`
        <td class="status-cell ${r}" style="background: ${i};">
          ${"pass"===(a=o.status)?"✓ V":"fail"===a?"✗ X":""}
        </td>
        <td class="detail-cell" style="background: ${i};">
          ${f(o.detail||"")}
        </td>
      `}),n+="</tr>"}),n),l=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box;
    }
    
    html, body { 
      width: 100%; 
      height: 100%;
      background: white;
    }
    
    body { 
      font-family: 'Arial', sans-serif;
      font-size: 9px;
      color: #0f172a;
    }
    
    .page {
      width: 297mm;
      min-height: 210mm;
      padding: 8mm;
      background: white;
      page-break-after: always;
    }
    
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 10px;
    }
    
    .logo-box {
      width: 55px;
      background: #1a3a6b;
      color: white;
      padding: 8px;
      border-radius: 3px;
      text-align: center;
      font-weight: bold;
      font-size: 8px;
      line-height: 1.2;
      flex-shrink: 0;
    }
    
    .title-section {
      flex: 1;
      text-align: center;
    }
    
    .title-section h1 {
      font-size: 15px;
      color: #1a3a6b;
      margin-bottom: 3px;
      font-weight: bold;
    }
    
    .title-section p {
      font-size: 11px;
      color: #334155;
      font-style: italic;
    }
    
    .meta-box {
      width: 110px;
      font-size: 8px;
    }
    
    .meta-row {
      display: flex;
      margin-bottom: 2px;
      align-items: center;
    }
    
    .meta-label {
      font-weight: bold;
      width: 60px;
    }
    
    .meta-value {
      flex: 1;
      border-bottom: 0.5px solid #94a3b8;
      padding-bottom: 1px;
    }
    
    .info-table {
      width: 100%;
      margin-bottom: 8px;
      border-collapse: collapse;
    }
    
    .info-table td {
      padding: 3px;
      border: 0.5px solid #94a3b8;
      font-size: 8px;
    }
    
    .info-label {
      font-weight: bold;
      background: #f5f5f5;
      width: auto;
    }
    
    .instructions {
      background: #f9f9f9;
      border-left: 2px solid #1a3a6b;
      padding: 4px 6px;
      margin-bottom: 8px;
      font-size: 8px;
      line-height: 1.3;
    }
    
    .instructions strong {
      color: #166534;
    }
    
    .instructions .fail {
      color: #991b1b;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 8px;
    }
    
    th {
      background: #1a3a6b;
      color: white;
      padding: 3px;
      font-weight: bold;
      border: 0.5px solid #94a3b8;
    }
    
    th.day-header {
      background: #3a72c4;
      padding: 4px 2px;
      font-size: 7px;
    }
    
    td {
      border: 0.5px solid #94a3b8;
      padding: 2px;
    }
    
    .group-obs {
      background: #1a3a6b;
      color: white;
      font-weight: bold;
      text-align: center;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      width: 20px;
      font-size: 7px;
    }
    
    .group-op {
      background: #0f5132;
    }
    
    .item-cell {
      text-align: left;
      background: white;
      padding: 3px;
    }
    
    .item-cell.alt {
      background: #f0f5ff;
    }
    
    .item-name {
      font-weight: bold;
      font-size: 8px;
      margin-bottom: 1px;
    }
    
    .item-desc {
      font-size: 7px;
      color: #334155;
    }
    
    .status-cell {
      text-align: center;
      font-weight: bold;
      font-size: 11px;
      width: 18px;
    }
    
    .status-pass {
      background: #f0fdf4;
      color: #166534;
    }
    
    .status-fail {
      background: #fff1f2;
      color: #991b1b;
    }
    
    .detail-cell {
      font-size: 7px;
      text-align: left;
      width: 42px;
      word-break: break-word;
    }
    
    .signature-cell {
      text-align: center;
      background: #f8fafc;
      padding: 4px 2px;
    }
    
    .notes-section {
      background: #f8fafc;
      padding: 6px;
      margin-top: 8px;
      border: 0.5px solid #e2e8f0;
      font-size: 8px;
    }
    
    .notes-section strong {
      color: #1a3a6b;
    }
    
    .footer-text {
      font-size: 7px;
      color: #64748b;
      margin-top: 8px;
      line-height: 1.4;
      border-top: 0.5px solid #e2e8f0;
      padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header-container">
      <div class="logo-box">
        Universal<br/>Robina
      </div>
      <div class="title-section">
        <h1>BIỂU MẪU KIỂM TRA AN TO\xc0N H\xc0NG NG\xc0Y</h1>
        <p>Operators Safety daily Checklist</p>
      </div>
      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-label">Trang:</span>
          <span class="meta-value">1/1</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Ng\xe0y:</span>
          <span class="meta-value">20/09/2025</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">M\xe3 hiệu:</span>
          <span class="meta-value">WH-SOP01-FR01</span>
        </div>
      </div>
    </div>

    <!-- Info Table 1 -->
    <table class="info-table">
      <tr>
        <td class="info-label" style="width: 50px;">Model:</td>
        <td>${f(e.forklift_model||".......................................")}</td>
        <td class="info-label" style="width: 50px;">Số Seri:</td>
        <td>${f(e.forklift_serial||".......................................")}</td>
        <td class="info-label" style="width: 50px;">Tuần thứ:</td>
        <td>${e.week_number}/${e.year}</td>
        <td class="info-label" style="width: 40px;">Ca thứ:</td>
        <td>${f(e.shift||".....")}</td>
      </tr>
    </table>

    <!-- Info Table 2 -->
    <table class="info-table">
      <tr>
        <td class="info-label" style="width: 50px;">Xe số:</td>
        <td>${f(e.forklift_number||".......................")}</td>
        <td style="font-style: italic; font-size: 7px;">
          Ghi ch\xfa: Bi\xean bản kiểm tra n\xe0y cần được thực hiện bởi t\xe0i xế bắt đầu v\xe0o ca l\xe0m việc. 
          C\xe1c mục liệt k\xea chỉ \xe1p dụng cho một số loại xe. Cần phải kiểm tra hết c\xe1c mục được ghi b\xean dưới.
        </td>
      </tr>
    </table>

    <!-- Instructions -->
    <div class="instructions">
      <strong>✓ V</strong> = tốt, đạt | 
      <strong class="fail">✗ X</strong> = kh\xf4ng đạt | 
      <strong>Cần sửa chữa hay căn chỉnh (Ghi chi tiết cụ thể)</strong>
    </div>

    <!-- Main Table -->
    <table>
      <thead>
        <tr>
          <th colspan="2">NỘI DUNG KIỂM TRA</th>
          ${p.map(e=>`<th colspan="2" class="day-header">${h[e]}</th>`).join("")}
        </tr>
        <tr>
          <th style="width: 20px; font-size: 7px;">NH\xd3M</th>
          <th style="font-size: 8px;">CHI TIẾT</th>
          ${p.map(()=>'<th style="width: 18px; font-size: 7px;">T.T</th><th style="width: 42px; font-size: 7px;">Ghi ch\xfa</th>').join("")}
        </tr>
      </thead>
      <tbody>
        ${s}
        <tr>
          <td colspan="2" style="text-align: center; background: #1a3a6b; color: white; font-weight: bold;">
            T\xe0i xế xe n\xe2ng / Forklift driver
          </td>
          ${p.map(()=>'<td colspan="2" class="signature-cell">_______</td>').join("")}
        </tr>
        <tr>
          <td colspan="2" style="text-align: center; background: #1a3a6b; color: white; font-weight: bold;">
            Gi\xe1m s\xe1t / Supervisor
          </td>
          ${p.map(()=>'<td colspan="2" class="signature-cell">_______</td>').join("")}
        </tr>
      </tbody>
    </table>

    <!-- Notes -->
    <div class="notes-section">
      <strong>Ghi ch\xfa (C\xe1c mục cần sửa chữa hay căn chỉnh):</strong> 
      ${f(e.notes||"")}
    </div>

    <!-- Footer -->
    <div class="footer-text">
      <strong>Ch\xfa \xfd:</strong> Nếu xe n\xe2ng ph\xe1t hiện cần phải sửa chữa hay kh\xf4ng an to\xe0n cần phải dừng xe, b\xe1o c\xe1o cho người phụ tr\xe1ch ngay. 
      Kh\xf4ng được vận h\xe0nh xe n\xe2ng cho tới khi đ\xe3 được sửa chữa v\xe0 đảm bảo an to\xe0n. 
      Nếu trong khi hoạt động m\xe0 xe c\xf3 dấu hiệu kh\xf4ng an to\xe0n th\xec cần phải b\xe1o ngay với người phụ tr\xe1ch v\xe0 kh\xf4ng được vận h\xe0nh cho tới khi xe được sửa chữa v\xe0 vận h\xe0nh an to\xe0n. 
      Kh\xf4ng được tự \xfd sửa chữa hay c\xe2n chỉnh xe n\xe2ng trừ khi bạn được cho ph\xe9p.
    </div>
  </div>
</body>
</html>`;return new Promise((t,a)=>{try{let o=i(),n=`XeNang_Tuan${e.week_number}_${e.year}_${e.forklift_number||"xe"}.pdf`;o.set({margin:[5,5,5,5],filename:n,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,logging:!1},jsPDF:{orientation:"landscape",unit:"mm",format:"a4"}}).from(l).outputPdf("arraybuffer").then(e=>{console.log("PDF generated successfully"),t(Buffer.from(e))}).catch(e=>{console.error("html2pdf error:",e),a(Error(`PDF generation failed: ${e?.message||e}`))})}catch(e){console.error("Unexpected error in generatePDFReport:",e),a(e)}})}function f(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}let g="nodejs";async function u(e,{params:t}){if(!await (0,l.getServerSession)(d.L))return s.NextResponse.json({error:"Unauthorized"},{status:401});let a=(0,c.m)(),{data:o,error:i}=await a.from("checklists").select("*").eq("id",t.id).single();if(i||!o)return s.NextResponse.json({error:"Not found"},{status:404});try{let e=await x(o),t=`XeNang_Tuan${o.week_number}_${o.year}_${o.forklift_number||"xe"}.pdf`;return new Response(e,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${t}"`}})}catch(e){return console.error("PDF generation error:",e),s.NextResponse.json({error:"PDF generation failed",details:String(e)},{status:500})}}let b=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/pdf/[id]/route",pathname:"/api/pdf/[id]",filename:"route",bundlePath:"app/api/pdf/[id]/route"},resolvedPagePath:"/workspaces/checklist-URCWH/app/api/pdf/[id]/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:m,staticGenerationAsyncStorage:w,serverHooks:v}=b,y="/api/pdf/[id]/route";function k(){return(0,r.patchFetch)({serverHooks:v,staticGenerationAsyncStorage:w})}},90455:(e,t,a)=>{a.d(t,{L:()=>s});var o=a(53797),i=a(42023),n=a.n(i),r=a(85662);let s={providers:[(0,o.Z)({name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(e){if(!e?.email||!e?.password)return null;let t=(0,r.m)(),{data:a,error:o}=await t.from("users").select("*").eq("email",e.email).eq("active",!0).single();return!o&&a&&await n().compare(e.password,a.password_hash)?{id:a.id,name:a.name,email:a.email,role:a.role}:null}})],session:{strategy:"jwt"},callbacks:{jwt:async({token:e,user:t})=>(t&&(e.role=t.role,e.id=t.id),e),session:async({session:e,token:t})=>(e.user&&(e.user.role=t.role,e.user.id=t.id),e)},pages:{signIn:"/auth/login",error:"/auth/login"}}},85662:(e,t,a)=>{a.d(t,{m:()=>i});var o=a(3370);function i(){let e=process.env.NEXT_PUBLIC_SUPABASE_URL,t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw Error("Missing Supabase service env variables");return(0,o.eI)(e,t)}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),o=t.X(0,[276,260,972],()=>a(85661));module.exports=o})();