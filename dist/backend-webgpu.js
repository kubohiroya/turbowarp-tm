/*! @license Includes TensorFlow.js WebGPU backend 4.22.0 (Apache-2.0). See https://github.com/kubohiroya/turbowarp-tm/blob/v3.1.0/THIRD_PARTY_NOTICES.md. */
(function(d){"use strict";function Nt(s){const t=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(s){for(const e in s)if(e!=="default"){const i=Object.getOwnPropertyDescriptor(s,e);Object.defineProperty(t,e,i.get?i:{enumerable:!0,get:()=>s[e]})}}return t.default=s,Object.freeze(t)}const zt=Nt(d);const X=d.env();X.registerFlag("WEBGPU_DEFERRED_SUBMIT_BATCH_SIZE",()=>15),X.registerFlag("WEBGPU_CPU_FORWARD",()=>!0),X.registerFlag("WEBGPU_MATMUL_PROGRAM_TYPE",()=>-1),X.registerFlag("WEBGPU_USE_NAIVE_CONV2D_TRANSPOSE",()=>!0),X.registerFlag("WEBGPU_USE_LOW_POWER_GPU",()=>!1),X.registerFlag("WEBGPU_CPU_HANDOFF_SIZE_THRESHOLD",()=>1e3),X.registerFlag("WEBGPU_USE_PROFILE_TOOL",()=>!1),X.registerFlag("WEBGPU_IMPORT_EXTERNAL_TEXTURE",()=>!0),X.registerFlag("WEBGPU_USE_NAIVE_CONV2D_DEBUG",()=>!1),X.registerFlag("WEBGPU_THRESHOLD_TO_INCREASE_WORKGROUPS_FOR_MATMUL",()=>-1),X.registerFlag("WEBGPU_CONV_SEPARATE_IM2COL_SHADER",()=>!1),X.registerFlag("WEBGPU_PRINT_SHADER",()=>""),X.registerFlag("WEBGPU_ENGINE_COMPILE_ONLY",()=>!1);class At{constructor(t){t&&(this.vendor=t.vendor,this.architecture=t.architecture,this.intelGPUGeneration=this.getIntelGPUGeneration())}getIntelGPUGeneration(){if(this.isIntel()){if(this.architecture.startsWith("gen"))return Number(this.architecture.match(/\d+/));if(this.architecture.startsWith("xe"))return 12}return 0}isIntel(){return this.vendor==="intel"}}class Ft{constructor(t){this.device=t,this.numUsedBuffers=0,this.numFreeBuffers=0,this.freeBuffers=new Map,this.usedBuffers=new Map,this.numBytesUsed=0,this.numBytesAllocated=0}acquireBuffer(t,e,i=!1,o=!0){let r;const n=Oe(t,e);return o?(this.freeBuffers.has(n)||this.freeBuffers.set(n,[]),this.freeBuffers.get(n).length>0?(r=this.freeBuffers.get(n).pop(),this.numFreeBuffers--):(r=this.device.createBuffer({size:t,usage:e,mappedAtCreation:i}),this.numBytesAllocated+=t)):(r=this.device.createBuffer({size:t,usage:e,mappedAtCreation:i}),this.numBytesAllocated+=t),this.usedBuffers.has(n)||this.usedBuffers.set(n,[]),this.usedBuffers.get(n).push(r),this.numUsedBuffers++,this.numBytesUsed+=t,r}releaseBuffer(t,e=!0){if(this.freeBuffers.size===0)return;const i=t.size,o=t.usage,r=Oe(i,o),n=this.usedBuffers.get(r),a=n.indexOf(t);if(a<0)throw new Error("Cannot find the buffer in buffer manager");n[a]=n[n.length-1],n.pop(),this.numUsedBuffers--,this.numBytesUsed-=i,e?(this.freeBuffers.get(r).push(t),this.numFreeBuffers++):(t.destroy(),this.numBytesAllocated-=i)}getNumUsedBuffers(){return this.numUsedBuffers}getNumFreeBuffers(){return this.numFreeBuffers}dispose(){this.freeBuffers.forEach((t,e)=>{t.forEach(i=>{i.destroy()})}),this.usedBuffers.forEach((t,e)=>{t.forEach(i=>{i.destroy()})}),this.freeBuffers=new Map,this.usedBuffers=new Map,this.numUsedBuffers=0,this.numFreeBuffers=0,this.numBytesUsed=0,this.numBytesAllocated=0}}function Oe(s,t){return`${s}_${t}`}class _t{constructor(t){this.device=t,this.numUsedTextures=0,this.numFreeTextures=0,this.freeTextures=new Map,this.usedTextures=new Map,this.numBytesUsed=0,this.numBytesAllocated=0}acquireTexture(t,e,i,o){const r=He(i),n=t*e*r,a=Ge(t,e,i,o);if(this.freeTextures.has(a)||this.freeTextures.set(a,[]),this.usedTextures.has(a)||this.usedTextures.set(a,[]),this.numBytesUsed+=n,this.numUsedTextures++,this.freeTextures.get(a).length>0){this.numFreeTextures--;const l=this.freeTextures.get(a).shift();return this.usedTextures.get(a).push(l),l}this.numBytesAllocated+=n;const u=this.device.createTexture({size:[t,e],format:i,usage:o});return this.usedTextures.get(a).push(u),u}releaseTexture(t){if(this.freeTextures.size===0)return;const e=t.width,i=t.height,o=t.format,r=t.usage,n=Ge(e,i,o,r);this.freeTextures.has(n)||this.freeTextures.set(n,[]),this.freeTextures.get(n).push(t),this.numFreeTextures++,this.numUsedTextures--;const a=this.usedTextures.get(n),u=a.indexOf(t);if(u<0)throw new Error("Cannot release a texture that was never provided by this texture manager");a.splice(u,1);const l=He(o),c=e*i*l;this.numBytesUsed-=c}getNumUsedTextures(){return this.numUsedTextures}getNumFreeTextures(){return this.numFreeTextures}dispose(){this.freeTextures.forEach((t,e)=>{t.forEach(i=>{i.destroy()})}),this.usedTextures.forEach((t,e)=>{t.forEach(i=>{i.destroy()})}),this.freeTextures=new Map,this.usedTextures=new Map,this.numUsedTextures=0,this.numFreeTextures=0,this.numBytesUsed=0,this.numBytesAllocated=0}}function Ge(s,t,e,i){return`${s}_${t}_${e}_${i}`}function He(s){if(s==="rgba8unorm")return 16;throw new Error(`${s} is not supported!`)}function Lt(s,t){if(Math.max(...s)>5)throw new Error("Cannot symbolically compute strides for rank > 6 tensor.");const e=s.length,i="xyzwuv",o=s.map(n=>`${t}.${i[n]}`),r=new Array(e-1);r[e-2]=o[e-1];for(let n=e-3;n>=0;--n)r[n]=`(${r[n+1]} * ${o[n+1]})`;return r}const Z=(s,t,e)=>e==="int32"?`atomicAdd(${s}, bitcast<i32>(${t}));`:`
          {
            var oldValue = 0;
            loop {
              let newValueF32 = bitcast<f32>(oldValue) + (${t});
              let newValue = bitcast<i32>(newValueF32);
              let res = atomicCompareExchangeWeak(${s}, oldValue, newValue);
              if res.exchanged {
                break;
              }
              oldValue = res.old_value;
            }
          }`;var re;(function(s){s[s.FROM_PIXELS=0]="FROM_PIXELS",s[s.DRAW=1]="DRAW"})(re||(re={}));const Et=(s,t,e,i,o)=>{const r={dtype:i.dtype,shape:i.shape},n=Bt(e,r,t),a=s.createShaderModule({code:n,label:t.constructor.name});let u=d.env().get("WEBGPU_PRINT_SHADER");if(u!==""){u=u.toLowerCase();const l=u.split(",");(u==="all"||l.some(c=>t.shaderKey.toLowerCase().includes(c)))&&(console.group(t.shaderKey),console.debug(n),console.groupEnd())}return o?s.createComputePipelineAsync({compute:{module:a,entryPoint:"_start"},label:t.constructor.name,layout:"auto"}):s.createComputePipeline({compute:{module:a,entryPoint:"_start"},label:t.constructor.name,layout:"auto"})},z=(s,t="f32")=>{switch(s){case 1:return`${t}`;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${s}-component ${t} is not supported.`)}};function L(s){if(s<=1)return"i32";if(s===2)return"vec2<i32>";if(s===3)return"vec3<i32>";if(s===4)return"vec4<i32>";if(s===5)return"vec5";if(s===6)return"vec6";throw Error(`GPU for rank ${s} is not yet supported`)}function j(s){if(s===0)return"x";if(s===1)return"y";if(s===2)return"z";if(s===3)return"w";if(s===4)return"u";if(s===5)return"v";throw Error(`Index ${s} is not yet supported`)}function y(...s){let t;switch(s.length){case 0:t=`
        fn main()
      `;break;case 1:t=`
        fn main(${s[0]} : i32)
      `;break;default:throw Error("Unreachable")}return t}function Xe(s,t){let e;return e=`
     ${Tt(t)}
      fn _start(@builtin(local_invocation_id) LocalId : vec3<u32>,
                @builtin(global_invocation_id) GlobalId : vec3<u32>,
                @builtin(local_invocation_index) LocalIndex: u32,
                @builtin(workgroup_id) WorkgroupId : vec3<u32>,
                @builtin(num_workgroups) NumWorkgroups : vec3<u32>) {
        localId = LocalId;
        localIndex = LocalIndex;
        globalId = GlobalId;
        numWorkgroups = NumWorkgroups;
        workgroupId = WorkgroupId;
        ${s?"main(getGlobalIndex());":"main();"};
      }
    `,e}function Tt(s){return`
  @compute @workgroup_size(${s.workgroupSize[0]}, ${s.workgroupSize[1]}, ${s.workgroupSize[2]})
`}function Bt(s,t,e){const i=[],o=e.workgroupSize[0]*e.workgroupSize[1]*e.workgroupSize[2];if(e.outputComponent=e.outputComponent?e.outputComponent:1,i.push(`

      var<private> localId: vec3<u32>;
      var<private> localIndex: u32;
      var<private> globalId: vec3<u32>;
      var<private> numWorkgroups: vec3<u32>;
      var<private> workgroupId: vec3<u32>;

      // Only used when the y/z dimension of workgroup size is 1.
      fn getGlobalIndex() -> i32 {
        ${qe(e)?"  return i32(globalId.x);":`  return i32((workgroupId.z * numWorkgroups.x * numWorkgroups.y +
                workgroupId.y * numWorkgroups.x + workgroupId.x) * ${o}u +
                localIndex);
        `}
      }
    `),e.pixelsOpType!=null){const f=e.pixelsOpType===re.FROM_PIXELS?`@group(0) @binding(0) var<storage, read_write> result: array<${J(t.dtype,e.outputComponent)}>;`:`@group(0) @binding(1) var<storage, read> inBuf : array<${J(s[0].dtype,e.outputComponent)}>;`,g=t.shape.length===3?"vec2<i32>":"i32";i.push(`
        struct Uniform {
          outShapeStrides : ${g},
          size            : i32,
          numChannels     : i32,
          alpha           : f32,
        };

        ${f}
        @group(0) @binding(2) var<uniform> uniforms: Uniform;
      `);const x=Ye(e);return[Ke,i.join(`
`),we(t.shape),e.getUserCode(),Xe(x,e)].join(`
`)}let r,n,a="struct Uniforms { NAN : f32, INFINITY : f32, ";e.variableNames.forEach((f,g)=>{const x=L(s[g].shape.length);a+=`${f.charAt(0).toLowerCase()+f.slice(1)}Shape : ${x}, `,r=s[g].shape.length-1,n=L(r),a+=`${f.charAt(0).toLowerCase()+f.slice(1)}ShapeStrides: ${n}, `});const u=L(t.shape.length);a+=`outShape : ${u}, `,r=t.shape.length-1,n=L(r),a+=`
         outShapeStrides: ${n}, `,e.size&&(a+="size : i32, "),e.uniforms&&(a+=e.uniforms),a+="};",a=Kt(a),i.push(a),e.atomic?i.push(`
      @group(0) @binding(0) var<storage, read_write> result: array<atomic<i32>>;
    `):i.push(`
      @group(0) @binding(0) var<storage, read_write> result: array<${J(t.dtype,e.outputComponent)}>;
    `),e.variableNames.forEach((f,g)=>{i.push(`
      @group(0) @binding(${1+g}) var<storage, read> ${f}: array<${e.variableComponents?J(s[g].dtype,e.variableComponents[g]):J(s[g].dtype,e.outputComponent)}>;
        `)}),a!==""&&i.push(`
      @group(0) @binding(${1+e.variableNames.length}) var<uniform> uniforms: Uniforms;
      `);const l=Gt(t.shape,e.dispatchLayout),c=[Ke,i.join(`
`)+Mt,we(t.shape),l,Ht(t.shape.length)];e.atomic||c.push(Xt(t.shape,t.dtype,e.outputComponent)),e.variableNames.forEach((f,g)=>{c.push(`${we(s[g].shape,f)}`)});const h=s.map((f,g)=>Ot(f,t.shape,e.variableComponents?e.variableComponents[g]:e.outputComponent,e.dispatchLayout.x.length===t.shape.length)).join(`
`);c.push(h),c.push(e.getUserCode());const p=Ye(e);return c.push(Xe(p,e)),c.join(`
`)}function Wt(s,t,e){let i=s.shaderKey;if(s.pixelsOpType!=null)return i;const o=[],r=[];t.forEach(c=>{o.push(c.shape),r.push(c.dtype)}),o.push(e.shape),r.push(e.dtype);const n=t.map(c=>d.backend_util.getBroadcastDims(c.shape,e.shape)),a=t.map(c=>d.util.arraysEqual(c.shape,e.shape)).join("_"),u=n.map(c=>c.join("_")).join(";"),l=qe(s)?"flatDispatch":"";return i+="_"+(s.workgroupSize?s.workgroupSize.join(","):"")+o.map(c=>c.length).join(",")+r.join(",")+s.variableNames.join(",")+u+a+l,i}const Ke=`
  struct vec5 {x: i32, y: i32, z: i32, w: i32, u: i32};
  struct vec6 {x: i32, y: i32, z: i32, w: i32, u: i32, v: i32};

  // Checks whether coordinates lie within the bounds of the shape.
  fn coordsInBounds2D(coord : vec2<i32>, shape : vec2<i32>) -> bool {
    return all(coord >= vec2<i32>(0)) && all(coord < shape);
  }
  fn coordsInBounds3D(coord : vec3<i32>, shape : vec3<i32>) -> bool {
    return all(coord >= vec3<i32>(0)) && all(coord < shape);
  }
  fn coordsInBounds4D(coord : vec4<i32>, shape : vec4<i32>) -> bool {
    return all(coord >= vec4<i32>(0)) && all(coord < shape);
  }

  fn getIndexFromCoords1D(coord : i32, shape : i32) -> i32 {
    return coord;
  }
  fn getIndexFromCoords2D(coords : vec2<i32>, shape : vec2<i32>) -> i32 {
    return dot(coords, vec2<i32>(shape.y, 1));
  }
  fn getIndexFromCoords3D(coords : vec3<i32>, shape : vec3<i32>) -> i32 {
    return dot(coords, vec3<i32>(shape.y * shape.z, shape.z, 1));
  }
  fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
    return dot(coords, vec4<i32>(
        shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
  }
  fn getIndexFromCoords5D(coords : vec5, shape : vec5) -> i32 {
    let shapeStrides: vec5 = vec5(shape.y * shape.z * shape.w * shape.u, shape.z * shape.w * shape.u, shape.w * shape.u, shape.u, 1);
    return coords.x*shapeStrides.x + coords.y*shapeStrides.y + coords.z*shapeStrides.z + coords.w*shapeStrides.w + coords.u*shapeStrides.u;
  }
  fn getIndexFromCoords6D(coords : vec6, shape : vec6) -> i32 {
    let shapeStrides: vec6 = vec6(shape.y * shape.z * shape.w * shape.u * shape.v, shape.z * shape.w * shape.u * shape.v, shape.w * shape.u * shape.v, shape.u * shape.v, shape.v, 1);
    return coords.x*shapeStrides.x + coords.y*shapeStrides.y + coords.z*shapeStrides.z + coords.w*shapeStrides.w + coords.u*shapeStrides.u + coords.v*shapeStrides.v;
  }

  // NaN defination in IEEE 754-1985 is :
  //   - sign = either 0 or 1.
  //   - biased exponent = all 1 bits.
  //   - fraction = anything except all 0 bits (since all 0 bits represents infinity).
  // https://en.wikipedia.org/wiki/IEEE_754-1985#Representation_of_non-numbers
  fn isnan(val: f32) -> bool {
    let floatToUint: u32 = bitcast<u32>(val);
    return (floatToUint & 0x7fffffffu) > 0x7f800000u;
  }
  fn isnanVec4(val : vec4<f32>) -> vec4<bool> {
    let floatToUint: vec4<u32> = bitcast<vec4<u32>>(val);
    return (floatToUint & vec4<u32>(0x7fffffffu)) > vec4<u32>(0x7f800000u);
  }
`,Mt=`
  fn isinf(val: f32) -> bool {
    return abs(val) == uniforms.INFINITY;
  }
`;function we(s,t=""){const e=s.length,i=t!==""?`get${t.charAt(0).toUpperCase()+t.slice(1)}CoordsFromIndex`:"getCoordsFromIndex",o=t!==""?`${t.charAt(0).toLowerCase()+t.slice(1)}ShapeStrides`:"outShapeStrides";if(e<=1)return`fn ${i}(index : i32) -> i32 { return index; }`;const r=d.util.computeStrides(s),n=L(e),a=[];for(let l=0;l<e;l++)a.push(`d${l}`);if(r.length===1)return`    fn ${i}(index : i32) -> vec2<i32> {
      let d0 = index / uniforms.${o}; let d1 = index - d0 * uniforms.${o};
      return vec2<i32>(d0, d1);
    }`;let u;return u="var index2 = index;"+r.map((l,c)=>{const h=`let ${a[c]} = index2 / uniforms.${o}.${j(c)}`,p=c===r.length-1?`let ${a[c+1]} = index2 - ${a[c]} * uniforms.${o}.${j(c)}`:`index2 = index2 - ${a[c]} * uniforms.${o}.${j(c)}`;return`${h}; ${p};`}).join(""),`
    fn ${i}(index : i32) -> ${n} {
      ${u}
      return ${n}(${a.join(",")});
    }
  `}function Vt(s,t){const e=s.name,i=s.shape.length,o=L(i),r="get"+e.charAt(0).toUpperCase()+e.slice(1),n=["d0","d1","d2","d3","d4","d5"].slice(0,i),a=n.map(c=>`${c} : i32`).join(", ");if(i<1)return`
      fn ${r}() -> ${z(t)} {
        return ${z(t)}(${e}[0]);
      }
    `;const u=`uniforms.${e.charAt(0).toLowerCase()+e.slice(1)}Shape`;let l=`${i}D`;return i===0&&(l="1D"),`
    fn ${r}(${a}) -> ${z(t)} {
      return ${z(t)}(${e}[getIndexFromCoords${l}(${o}(${n.join(",")}),
        ${u})${t===1?"":` / ${t}`}]);
    }
   `}function Ut(s,t,e,i){const o=s.name,r=o.charAt(0).toUpperCase()+o.slice(1),n="get"+r+"ByOutput",a=s.shape.length,u=t.length,l=L(u);if(d.util.arraysEqual(s.shape,t)&&i)return`
    fn ${n}Index(globalIndex : i32) -> ${z(e)} {
      return ${z(e)}(${o}[globalIndex]);
    }

    fn ${n}Coords(coords : ${l}) -> ${z(e)} {
      return ${z(e)}(${o}[${u>1?"getOutputIndexFromCoords(coords)":"coords"}${e===1?"":` / ${e}`}]);
    }
    `;const c=d.backend_util.getBroadcastDims(s.shape,t),h=u-a;let p="";if(a===0)return`
    fn ${n}Index(globalIndex : i32) -> ${z(e)}{
      return get${r}();
    }

    fn ${n}Coords(coords : ${l}) -> ${z(e)}{
      return get${r}();
    }
  `;u<2&&c.length>=1?p="coords = 0;":p=c.map(x=>`coords.${j(x+h)} = 0;`).join(`
`);let m="";if(u<2&&a>0)m="coords";else if(u>1){const x=L(a),C=s.shape.map((b,w)=>`coords.${j(w+h)}`).join(", ");m=`${x}(${C})`}else m="coords";const f=`uniforms.${o.charAt(0).toLowerCase()+o.slice(1)}Shape`,g=`${a}D`;return`
  fn ${n}Index(globalIndex : i32) -> ${z(e)} {
    var coords = getCoordsFromIndex(globalIndex);
    ${p}
    return ${z(e)}(${o}[getIndexFromCoords${g}(${m}, ${f})${e===1?"":` / ${e}`}]);
  }

  fn ${n}Coords(coordsIn : ${l}) -> ${z(e)} {
    var coords = coordsIn;
    ${p}
    return ${z(e)}(${o}[getIndexFromCoords${g}(${m}, ${f})${e===1?"":` / ${e}`}]);
  }
`}function Ot(s,t,e,i){let o=Vt(s,e);return s.shape.length<=t.length&&(o+=Ut(s,t,e,i)),o}function Gt(s,t){const{x:e,y:i=[],z:o=[]}=t,r=s.length,n=e.length+i.length+o.length;if(n!==r)return"";if(e.length===r)return`fn getOutputCoords() -> ${L(r)}{
    let globalIndex = getGlobalIndex();
    return getCoordsFromIndex(globalIndex);
  }
  `;let a="";const u=[e,i,o];for(let p=0;p<u.length;p++){const m=u[p];if(m.length!==0)if(m.length===1)a+=`let d${m[0]} = i32(globalId[${p}]);`;else{const f=Lt(m,"uniforms.outShape");a+=`var index${p} = i32(globalId[${p}]);`;for(let g=0;g<f.length;g++)a+=`let d${m[g]} = index${p} / ${f[g]};`,g===f.length-1?a+=`let d${m[g+1]} = index${p} - d${m[g]} * ${f[g]};`:a+=`index${p} = index${p} - d${m[g]} * ${f[g]};`}}const l=[];for(let p=0;p<n;p++)l.push(`d${p}`);const c=L(n);let h=`fn getOutputCoords() -> ${c} {
  ${a}
`;return l.length===0?h+=`return ${c}(0); }`:h+=`return ${c}(${l.join(",")}); }`,h}function Ht(s){let t="";switch(s){case 0:case 1:t+=`
        fn getOutputIndexFromCoords(coords : i32) -> i32 {
          return coords;
        }
        `;break;case 2:t+=`
        fn getOutputIndexFromCoords(coords : vec2<i32>) -> i32 {
          return dot(coords, vec2<i32>(uniforms.outShapeStrides, 1));
        }
        `;break;case 3:t+=`
        fn getOutputIndexFromCoords(coords : vec3<i32>) -> i32 {
          return dot(coords, vec3<i32>(uniforms.outShapeStrides.x, uniforms.outShapeStrides.y, 1));
        }
        `;break;case 4:t+=`
        fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
          return dot(coords, vec4<i32>(
            uniforms.outShapeStrides.x, uniforms.outShapeStrides.y, uniforms.outShapeStrides.z, 1));
        }
        `;break;case 5:t+=`
        fn getOutputIndexFromCoords(coords : vec5) -> i32 {
          return coords.x * uniforms.outShapeStrides.x +
              coords.y * uniforms.outShapeStrides.y +
              coords.z * uniforms.outShapeStrides.z +
              coords.w * uniforms.outShapeStrides.w +
              coords.u;
        }
        `;break;case 6:t+=`
        fn getOutputIndexFromCoords(coords : vec6) -> i32 {
          return coords.x * uniforms.outShapeStrides.x +
              coords.y * uniforms.outShapeStrides.y +
              coords.z * uniforms.outShapeStrides.z +
              coords.w * uniforms.outShapeStrides.w +
              coords.u * uniforms.outShapeStrides.u +
              coords.v;
        }
        `;break;default:d.util.assert(!1,()=>`Unsupported ${s}D shape`);break}return t}function qe(s){return s.dispatch[1]===1&&s.dispatch[2]===1}function J(s,t=1){if(s==="float32")return z(t,"f32");if(s==="int32"||s==="bool")return z(t,"i32");throw new Error(`type ${s} is not supported.`)}function Xt(s,t,e){const i=s.length,o=J(t,e);let r=`fn setOutputAtIndex(flatIndex : i32, value : ${z(e)}) {
      result[flatIndex] = ${o}(value);
    }

    fn setOutputAtIndexI32(flatIndex : i32, value : ${z(e,"i32")}) {
      result[flatIndex] = ${o}(value);
    }
    `;if(i>=2){const n=["d0","d1","d2","d3","d4","d5"].slice(0,i),a=L(i);r+=`
      fn setOutputAtCoords(${n.map(u=>`${u} : i32`).join(", ")}, value : ${z(e)}) {
        let flatIndex = getOutputIndexFromCoords(${a}(${n.join(", ")}));
        setOutputAtIndex(flatIndex${e===1?"":` / ${e}`}, value);
      }
      fn setOutputAtCoordsI32(${n.map(u=>`${u} : i32`).join(", ")}, value : ${z(e,"i32")}) {
        let flatIndex = getOutputIndexFromCoords(${a}(${n.join(", ")}));
        setOutputAtIndexI32(flatIndex${e===1?"":` / ${e}`}, value);
      }
    `}return r}function Kt(s){const t=/(\w+)\s*:\s*vec(5|6)/g;s=s.replace(t,i=>"@align(16) "+i);const e=/vec(5|6)\s*,\s*(\w+)/g;return s=s.replace(e,(i,o,r)=>`vec${o}, @align(16) ${r}`),s}function Ye(s){return!(s.dispatchLayout.hasOwnProperty("y")&&s.dispatchLayout.y.length!==0||s.dispatchLayout.hasOwnProperty("z")&&s.dispatchLayout.z.length!==0)}const ee=s=>{let t=1;for(let e=0;e<s.length;e++)t*=s[e];return t};function v(s,t,e=[1,1,1],i=[1,1,1]){const[o,r,n]=[Math.ceil(ee(s.x.map(a=>t[a]))/(e[0]*i[0])),s.y?Math.ceil(ee(s.y.map(a=>t[a]))/(e[1]*i[1])):1,s.z?Math.ceil(ee(s.z.map(a=>t[a]))/(e[2]*i[2])):1];return[o,r,n]}function je(s,t,e,i=!1){const o=[8,8,1],r=[4,4,1];return i||(s<=8&&(r[1]=1),t<=16&&e<=16&&(o[0]=4)),{workgroupSize:o,elementsPerThread:r}}function Ne(s,t,e=!1){if(e)return[8,8,1];const i=ee(s.x.map(r=>t[r])),o=ee(s.y.map(r=>t[r]));return i<=4?[4,16,1]:o<=4?[16,4,1]:[16,16,1]}function ze(s,t,e=!1){if(e)return[4,4,1];const i=ee(s.x.map(r=>t[r])),o=ee(s.y.map(r=>t[r]));return i<=4?[1,2,1]:o<=4?[2,1,1]:[2,2,1]}function R(s){return{x:s.map((t,e)=>e)}}function Ae(s){if(s==="float32"||s==="int32"||s==="bool"||s==="string")return 4;if(s==="complex64")return 8;throw new Error(`Unknown dtype ${s}`)}function Fe(){return!!(typeof globalThis<"u"&&globalThis.navigator&&globalThis.navigator.gpu)}function _e(s,t){Array.isArray(s)||(s=[s]),s.forEach(e=>{e!=null&&d.util.assert(e.dtype!=="complex64",()=>`${t} does not support complex64 tensors in the WebGPU backend.`)})}var q;(function(s){s[s.MatMulReduceProgram=0]="MatMulReduceProgram",s[s.MatMulSplitKProgram=1]="MatMulSplitKProgram",s[s.MatMulSmallOutputSizeProgram=2]="MatMulSmallOutputSizeProgram",s[s.MatMulPackedProgram=3]="MatMulPackedProgram",s[s.MatMulMax=4]="MatMulMax"})(q||(q={}));const qt=Object.freeze(Object.defineProperty({__proto__:null,GPUBytesPerElement:Ae,get MatMulProgramType(){return q},assertNotComplex:_e,computeDispatch:v,computeWorkPerThreadForConv2d:ze,computeWorkgroupInfoForMatMul:je,computeWorkgroupSizeForConv2d:Ne,flatDispatchLayout:R,isWebGPUSupported:Fe},Symbol.toStringTag,{value:"Module"}));const Yt=d.env().getNumber("WEBGPU_CPU_HANDOFF_SIZE_THRESHOLD"),jt=(s,t)=>{const e=s.limits.maxComputeWorkgroupsPerDimension,i=t.dispatchLayout,o=t.dispatch;if(o.every(n=>n<=e))return o;d.util.assert(o[0]>e&&i.y===void 0&&i.z===void 0,()=>"Dispatch size exceeds WebGPU limits in Y or Z dimension.");let r=Math.ceil(Math.sqrt(o[0]));return r>e?(r=Math.ceil(Math.cbrt(o[0])),d.util.assert(r<=e,()=>"Total dispatch size exceeds WebGPU maximum."),[r,r,r]):[r,r,1]};class Se extends d.KernelBackend{nextDataId(){return Se.nextDataId++}constructor(t,e){if(super(),this.commandQueueOwnedIds=new WeakSet,this.dispatchCountInPass=0,this.disposed=!1,this.downloadWaitMs=0,this.tensorDataPendingDisposal=[],this.queryResolveBuffer=null,this.querySet=null,this.querySetCount=2,this.stagingPendingDisposal=[],this.uniformPendingDisposal=[],this.uploadWaitMs=0,this.hasReadSyncWarned=!1,this.hasTimestampQueryWarned=!1,!Fe())throw new Error("WebGPU is not supported on this device");this.pipelineCache={},this.device=t,this.queue=t.queue,this.commandEncoder=null,this.computePassEncoder=null,this.adapterInfo=new At(e),this.supportTimestampQuery=this.device.features.has("timestamp-query"),this.thresholdToIncreaseWorkgroups=this.adapterInfo.intelGPUGeneration>=12?16:8,this.bufferManager=new Ft(this.device),this.textureManager=new _t(this.device),this.tensorMap=new d.DataStorage(this,d.engine()),d.env().getBool("WEBGPU_USE_PROFILE_TOOL")&&(this.dummyCanvas=document.createElement("canvas"),this.dummyCanvas.width=1,this.dummyCanvas.height=1,this.dummyContext=this.dummyCanvas.getContext("webgpu"),this.dummyContext.configure({device:t,format:"bgra8unorm"}),document.body.appendChild(this.dummyCanvas))}floatPrecision(){return 32}disposeData(t,e=!1){if(!this.tensorMap.has(t))return!0;const i=this.tensorMap.get(t);return e?i.refCount=0:i.refCount--,i.refCount>0?!1:(i.complexTensorInfos!=null&&(this.disposeData(i.complexTensorInfos.real.dataId),this.disposeData(i.complexTensorInfos.imag.dataId)),this.commandQueueOwnedIds.has(t)?(this.tensorDataPendingDisposal.push(t),!0):(this.releaseResource(t),this.tensorMap.delete(t),!0))}memory(){return{numBytesInGPU:this.bufferManager.numBytesUsed,numBytesAllocatedInGPU:this.bufferManager.numBytesAllocated,unreliable:!1}}releaseResource(t){const e=this.tensorMap.get(t);if(!(!e||!e.resource)){if(e.external){e.resource=null;return}e.resource instanceof GPUBuffer?this.bufferManager.releaseBuffer(e.resource):e.resource instanceof GPUTexture&&this.textureManager.releaseTexture(e.resource),e.resource=null}}refCount(t){return this.tensorMap.has(t)?this.tensorMap.get(t).refCount:0}incRef(t){const e=this.tensorMap.get(t);e.refCount++}decRef(t){if(this.tensorMap.has(t)){const e=this.tensorMap.get(t);e.refCount--}}write(t,e,i){if(i==="complex64"&&t!=null)throw new Error("Cannot write to a complex64 dtype. Please use tf.complex(real, imag).");const o={id:this.nextDataId()};return this.tensorMap.set(o,{dtype:i,shape:e,values:t,refCount:1}),o}move(t,e,i,o,r){if(o==="complex64")throw new Error("Cannot write to a complex64 dtype. Please use tf.complex(real, imag).");this.tensorMap.set(t,{dtype:o,shape:i,values:e,refCount:r})}submitQueue(){this.queue.submit([this.commandEncoder.finish()]),this.commandEncoder=null,this.dispatchCountInPass=0,this.commandQueueOwnedIds=new WeakSet,this.tensorDataPendingDisposal.forEach(t=>{this.releaseResource(t),this.tensorMap.delete(t)}),this.uniformPendingDisposal.forEach(t=>this.bufferManager.releaseBuffer(t)),this.stagingPendingDisposal.forEach(t=>this.bufferManager.releaseBuffer(t,!1)),this.tensorDataPendingDisposal=[],this.uniformPendingDisposal=[],this.stagingPendingDisposal=[]}ensureCommandEncoderReady(){this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder())}endComputePassEncoder(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}async checkCompileCompletionAsync(){let t;try{t=await Promise.all(Object.values(this.pipelineCache))}catch(e){throw new Error(e.message)}Object.keys(this.pipelineCache).map((e,i)=>{this.pipelineCache[e]=t[i]})}async getBufferData(t){if(d.env().getBool("WEBGPU_ENGINE_COMPILE_ONLY"))return console.warn("The data may be invalid since WEBGPU_ENGINE_COMPILE_ONLY is true, this can only be called when WEBGPU_ENGINE_COMPILE_ONLY is false"),null;const e=t.size,i=this.bufferManager.acquireBuffer(e,GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ);this.ensureCommandEncoderReady(),this.endComputePassEncoder(),this.commandEncoder.copyBufferToBuffer(t,0,i,0,e),this.submitQueue(),await i.mapAsync(GPUMapMode.READ);const o=i.getMappedRange().slice(0);return i.unmap(),i!=null&&this.bufferManager.releaseBuffer(i),d.env().getBool("WEBGPU_USE_PROFILE_TOOL")&&(d.util.assert(this.dummyContext!==void 0,()=>"Fail to get context for profiling tool"),this.dummyContext.getCurrentTexture()),o}convertAndCacheOnCPU(t,e){const i=this.tensorMap.get(t);return i.values=e,i.values}readSync(t){const e=this.tensorMap.get(t),{values:i,complexTensorInfos:o}=e;if(i!=null||e.dtype==="string")return i;if(e.dtype==="complex64"){const g=this.readSync(o.real.dataId),x=this.readSync(o.imag.dataId),C=d.util.convertBackendValuesAndArrayBuffer(d.backend_util.mergeRealAndImagArrays(g,x).buffer,"float32");return this.convertAndCacheOnCPU(t,C),C}this.hasReadSyncWarned||(this.hasReadSyncWarned=!0,console.warn("The performance of synchronously reading data from GPU to CPU is poor on the webgpu backend, please use asynchronous APIs instead."));const r=["opaque","premultiplied"],n=e.resource,a=n.size;d.util.assert(a%4===0,()=>"Because there is 4 bytes for one pixel, buffer size must be multiple of 4.");const u=a/4,l=new ArrayBuffer(a),c=256,h=256,p=r.map(g=>new OffscreenCanvas(c,h)),m=new OffscreenCanvas(c,h);this.endComputePassEncoder(),p.map((g,x)=>{const C=g.getContext("webgpu");return C.configure({device:this.device,format:"bgra8unorm",usage:GPUTextureUsage.COPY_DST,alphaMode:r[x]}),C.getCurrentTexture()}).map((g,x)=>{const C=c*4,b=(F,A,E)=>{this.ensureCommandEncoderReady(),this.commandEncoder.copyBufferToTexture({buffer:n,bytesPerRow:C,offset:E},{texture:g},{width:F,height:A}),this.submitQueue();const T=m.getContext("2d",{willReadFrequently:!0});T.clearRect(0,0,F,A),T.drawImage(p[x],0,0);const O=T.getImageData(0,0,F,A).data,V=r[x],B=new Uint8ClampedArray(l,E,F*A*4);for(let M=0;M<B.length;M+=4)if(V==="premultiplied")B[M+3]=O[M+3];else{const U=O[M];B[M]=O[M+2],B[M+1]=O[M+1],B[M+2]=U}},w=Math.floor(u/(c*h));let I=c,k=h,$=0;for(let F=0;F<w;F++)b(I,k,$),$+=c*h*4;const D=u%(c*h);k=Math.floor(D/c),k>0&&(b(I,k,$),$+=k*(c*4)),I=D%c,I>0&&b(I,1,$)});const f=d.util.convertBackendValuesAndArrayBuffer(l,e.dtype);return this.convertAndCacheOnCPU(t,f),f}async read(t){if(!this.tensorMap.has(t))throw new Error(`Tensor ${t} was not registered!`);const e=this.tensorMap.get(t),{values:i}=e;if(i!=null)return i;let o;if(e.dtype==="complex64"){const r=await Promise.all([this.read(e.complexTensorInfos.real.dataId),this.read(e.complexTensorInfos.imag.dataId)]),n=r[0],a=r[1];o=d.backend_util.mergeRealAndImagArrays(n,a)}else{const r=await this.getBufferData(e.resource);o=d.util.convertBackendValuesAndArrayBuffer(r,e.dtype)}return this.convertAndCacheOnCPU(t,o),o}copyBuffer(t){const e=t.size,i=t.usage,o=this.bufferManager.acquireBuffer(e,i);return this.ensureCommandEncoderReady(),this.endComputePassEncoder(),this.commandEncoder.copyBufferToBuffer(t,0,o,0,e),this.submitQueue(),o}createTensorFromGPUData(t,e,i){let o=t.buffer;if(i==="complex64")throw new Error("Cannot write to a complex64 dtype. ");const r={id:this.nextDataId()};this.tensorMap.set(r,{dtype:i,shape:e,values:null,refCount:1,external:t.zeroCopy});const n=this.tensorMap.get(r),a=Ae(n.dtype)*d.util.sizeFromShape(n.shape);if(t.buffer.size<a)throw new Error(`GPUBuffer size(${t.buffer.size}) is smaller than tensor size(${a})!`);if((t.buffer.usage&(GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC))!==(GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC))throw new Error("GPUBuffer.usage should include GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC!");return t.zeroCopy!==!0&&(o=this.copyBuffer(o)),n.resource=o,d.engine().makeTensorFromDataId(r,e,i,this)}readToGPU(t){const e=this.tensorMap.get(t),{values:i,dtype:o,shape:r,resource:n}=e;if(o==="complex64")throw new Error("Does not support reading buffer for complex64 dtype.");if(n==null)throw i!=null?new Error("Data is not on GPU but on CPU."):new Error("There is no data on GPU or CPU.");const a=n,u=a.size,l=a.usage,c=this.bufferManager.acquireBuffer(u,l);this.ensureCommandEncoderReady(),this.endComputePassEncoder(),this.commandEncoder.copyBufferToBuffer(n,0,c,0,u),this.submitQueue();const h=this.makeTensorInfo(r,o),p=d.engine().makeTensorFromTensorInfo(h),m=this.tensorMap.get(h.dataId);return m.resource=c,{tensorRef:p,buffer:c}}bufferSync(t){const e=this.readSync(t.dataId);if(t.dtype==="string")try{const i=e.map(o=>d.util.decodeString(o));return d.buffer(t.shape,t.dtype,i)}catch{throw new Error("Failed to decode encoded string bytes into utf-8")}return d.buffer(t.shape,t.dtype,e)}async time(t){!this.supportTimestampQuery&&!this.hasTimestampQueryWarned&&(console.warn("This device doesn't support timestamp-query extension. Start Chrome browser with flag --enable-dawn-features=allow_unsafe_apis to try it again. Otherwise, zero will be shown for the kernel time when profiling mode is enabled."),this.hasTimestampQueryWarned=!0);const e=this.activeTimers,i=[];let o=!1;this.programTimersStack==null?(this.programTimersStack=i,o=!0):this.activeTimers.push(i),this.activeTimers=i,t();const r=d.util.flatten(this.activeTimers.map(l=>l.query)).filter(l=>l!=null),n=d.util.flatten(this.activeTimers.map(l=>l.name)).filter(l=>l!=null);this.activeTimers=e,o&&(this.programTimersStack=null);const a={uploadWaitMs:this.uploadWaitMs,downloadWaitMs:this.downloadWaitMs,kernelMs:null,wallMs:null},u=await Promise.all(r);return a.kernelMs=d.util.sum(u),a.getExtraProfileInfo=()=>u.map((l,c)=>({name:n[c],ms:l})).map(l=>`${l.name}: ${l.ms}`).join(", "),this.uploadWaitMs=0,this.downloadWaitMs=0,a}makeTensorInfo(t,e,i){return e==="string"&&i!=null&&i.length>0&&d.util.isString(i[0])&&(i=i.map(r=>d.util.encodeString(r))),{dataId:this.write(i,t,e),shape:t,dtype:e}}tensorToBinding(t){if(!t)return null;const i=this.tensorMap.get(t.dataId).resource;return i instanceof GPUBuffer?{buffer:i}:i instanceof GPUTexture?i.createView():i}uploadToGPU(t){const e=this.tensorMap.get(t);if(e.resource!=null)return;const i=Ae(e.dtype)*d.util.sizeFromShape(e.shape);let o;const r=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST;if(e.values){if(o=this.bufferManager.acquireBuffer(i,r,!0),o.mapState==="unmapped"){const n=this.bufferManager.acquireBuffer(i,GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC,!0,!1),a=n.getMappedRange();e.dtype==="int32"||e.dtype==="bool"?new Int32Array(a).set(e.values):new Float32Array(a).set(e.values),n.unmap(),this.ensureCommandEncoderReady(),this.endComputePassEncoder(),this.commandEncoder.copyBufferToBuffer(n,0,o,0,i),this.stagingPendingDisposal.push(n)}else{const n=o.getMappedRange();e.dtype==="int32"||e.dtype==="bool"?new Int32Array(n).set(e.values):new Float32Array(n).set(e.values),o.unmap()}e.values=null}else o=this.bufferManager.acquireBuffer(i,r);e.resource=o}makeUniforms(t){let e=0,i=0;const o=[];let r=1;t.forEach(u=>{u.data.length===0&&(u.data=[1]);let l;switch(u.data.length){case 1:l=4;break;case 2:l=8;break;case 3:l=16;break;case 4:l=16;break;case 5:l=16;break;case 6:l=16;break;default:d.util.assert(!1,()=>`Unsupported ${u.data.length}D shape`)}(i===5||i===6)&&(l=16),l>r&&(r=l),e=Math.ceil(e/l)*l,i=u.data.length,o.push(e),e+=u.data.length*4}),e=Math.ceil(e/r)*r;const n=new ArrayBuffer(e);t.forEach((u,l)=>{const c=o[l];u.type==="int32"?new Int32Array(n,c,u.data.length).set(u.data):u.type==="uint32"?new Uint32Array(n,c,u.data.length).set(u.data):new Float32Array(n,c,u.data.length).set(u.data)});const a=this.bufferManager.acquireBuffer(e,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);return this.queue.writeBuffer(a,0,n,0,e),this.uniformPendingDisposal.push(a),{offset:0,size:e,buffer:a}}runWebGPUProgram(t,e,i,o,r){if(r||(r=this.makeTensorInfo(t.outputShape,i)),d.util.sizeFromShape(r.shape)===0)return this.tensorMap.get(r.dataId).values=d.util.getTypedArrayFromDType(r.dtype,0),r;this.uploadToGPU(r.dataId),t.dispatch=jt(this.device,t);const n=e.map((u,l)=>{if(u.dtype==="complex64")throw new Error("GPGPUProgram does not support complex64 input. For complex64 dtypes, please separate the program into real and imaginary parts.");return this.uploadToGPU(u.dataId),{dtype:this.tensorMap.get(u.dataId).dtype,shape:u.shape,name:t.variableNames[l]}});t.shaderKey=Wt(t,n,r);const a=d.env().getBool("WEBGPU_ENGINE_COMPILE_ONLY");return t.shaderKey in this.pipelineCache||(this.pipelineCache[t.shaderKey]=Et(this.device,t,n,r,a)),t.pipeline=this.pipelineCache[t.shaderKey],a||this.recordAndSubmit(t,r,e,o),r}recordAndSubmit(t,e,i,o){if(t.pipeline instanceof Promise)throw new Error("Please call checkCompileCompletionAsync to ensure parallel compilation is done!");let r=[],n=[];const a="int32";if(t.pixelsOpType==null){r.push({type:"float32",data:[NaN]},{type:"float32",data:[1/0]}),n=i.concat(e).map(m=>m.shape);const p="int32";n.map(m=>{r.push({type:p,data:m});const f=d.util.computeStrides(m);r.push({type:p,data:f})})}else{const p=d.util.computeStrides(e.shape);r.push({type:a,data:p})}if(t.size){const p=d.util.sizeFromShape(t.outputShape);r.push({type:a,data:[t.outputComponent?p/t.outputComponent:p]})}o&&(r=[...r,...o]);const u=[this.tensorToBinding(e),...i.map(p=>this.tensorToBinding(p)),this.makeUniforms(r)];i.forEach(p=>{this.commandQueueOwnedIds.add(p.dataId)}),this.commandQueueOwnedIds.add(e.dataId);const l=this.device.createBindGroup({layout:t.pipeline.getBindGroupLayout(0),entries:u.map((p,m)=>({binding:m,resource:p}))}),c=this.activeTimers!=null;this.ensureCommandEncoderReady();const h={};c&&this.supportTimestampQuery?(this.endComputePassEncoder(),this.querySet==null&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.querySetCount})),h.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:0,endOfPassWriteIndex:1},this.computePassEncoder=this.commandEncoder.beginComputePass(h)):this.computePassEncoder||(this.computePassEncoder=this.commandEncoder.beginComputePass(h)),this.computePassEncoder.setPipeline(t.pipeline),this.computePassEncoder.setBindGroup(0,l),this.computePassEncoder.dispatchWorkgroups(t.dispatch[0],t.dispatch[1],t.dispatch[2]),this.dispatchCountInPass++,(c||d.env().get("WEBGPU_DEFERRED_SUBMIT_BATCH_SIZE")<=this.dispatchCountInPass||t.pixelsOpType===re.DRAW)&&(this.endComputePassEncoder(),c?this.activeTimers.push({name:t.constructor.name,query:this.getQueryTime()}):this.submitQueue())}async getQueryTime(){if(!this.supportTimestampQuery)return 0;this.queryResolveBuffer==null&&(this.queryResolveBuffer=this.bufferManager.acquireBuffer(this.querySetCount*8,GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.QUERY_RESOLVE)),this.commandEncoder.resolveQuerySet(this.querySet,0,this.querySetCount,this.queryResolveBuffer,0);const t=this.bufferManager.acquireBuffer(this.querySetCount*8,GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST);this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,t,0,this.querySetCount*8),this.submitQueue(),await t.mapAsync(GPUMapMode.READ);const e=new BigUint64Array(t.getMappedRange()),i=Number(e[1]-e[0])/1e6;return t.unmap(),this.bufferManager.releaseBuffer(t),i}shouldExecuteOnCPU(t,e=Yt){return d.env().getBool("WEBGPU_CPU_FORWARD")&&t.every(i=>this.tensorMap.get(i.dataId).resource==null&&d.util.sizeFromShape(i.shape)<e)}numDataIds(){return this.tensorMap.numDataIds()-this.tensorDataPendingDisposal.length}dispose(){this.disposed||(this.querySet!=null&&this.querySet.destroy(),this.bufferManager.dispose(),this.textureManager.dispose(),this.disposed=!0)}}Se.nextDataId=0;Fe()&&d.registerBackend("webgpu",async()=>{const s={powerPreference:d.env().get("WEBGPU_USE_LOW_POWER_GPU")?"low-power":"high-performance"},t=await navigator.gpu.requestAdapter(s),e={},i=[];t.features.has("timestamp-query")&&i.push("timestamp-query"),t.features.has("bgra8unorm-storage")&&i.push(["bgra8unorm-storage"]),e.requiredFeatures=i;const o=t.limits;e.requiredLimits={maxComputeWorkgroupStorageSize:o.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:o.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:o.maxStorageBufferBindingSize,maxBufferSize:o.maxBufferSize,maxComputeWorkgroupSizeX:o.maxComputeWorkgroupSizeX,maxComputeInvocationsPerWorkgroup:o.maxComputeInvocationsPerWorkgroup};const r=await t.requestDevice(e),n="info"in t?t.info:"requestAdapterInfo"in t?await t.requestAdapterInfo():void 0;return new Se(r,n)},3);var N;(function(s){s[s.ADD=0]="ADD",s[s.ATAN2=1]="ATAN2",s[s.COMPLEX_MULTIPLY_IMAG=2]="COMPLEX_MULTIPLY_IMAG",s[s.COMPLEX_MULTIPLY_REAL=3]="COMPLEX_MULTIPLY_REAL",s[s.DIV=4]="DIV",s[s.ELU_DER=5]="ELU_DER",s[s.EQUAL=6]="EQUAL",s[s.FLOOR_DIV=7]="FLOOR_DIV",s[s.GREATER=8]="GREATER",s[s.GREATER_EQUAL=9]="GREATER_EQUAL",s[s.LESS=10]="LESS",s[s.LESS_EQUAL=11]="LESS_EQUAL",s[s.LOGICAL_AND=12]="LOGICAL_AND",s[s.LOGICAL_OR=13]="LOGICAL_OR",s[s.MAX=14]="MAX",s[s.MIN=15]="MIN",s[s.MOD=16]="MOD",s[s.MUL=17]="MUL",s[s.NOT_EQUAL=18]="NOT_EQUAL",s[s.POW=19]="POW",s[s.PRELU=20]="PRELU",s[s.SQUARED_DIFFERENCE=21]="SQUARED_DIFFERENCE",s[s.SUB=22]="SUB"})(N||(N={}));const Qt="let resultTemp = a + b;",Zt="let resultTemp = atan2(a, b);",Jt="let resultTemp = areal * breal - aimag * bimag;",es="let resultTemp = areal * bimag + aimag * breal;",ts="let resultTemp = a / b;",ss="let resultTemp = select(a * (b + 1.0), a, b >= b - b);",os=`
  let zero = sign(a) * 0 + 0;
  let one = sign(b) * 0 + 1;
  let resultTemp = select(zero, one, a == b);
`,is=`
  let remainder =
      select(a % b, round(a % b), (round(a) == a) & (round(b) == b));
  let quotient = (a - remainder) / b;
  let resultTemp =
      round(select(quotient, quotient - 1, sign(remainder) == -sign(b)));
`,rs=`
  let zero = sign(a) * 0 + 0;
  let one = sign(b) * 0 + 1;
  let resultTemp = select(zero, one, a > b);
`,ns=`
  let zero = sign(a) * 0 + 0;
  let one = sign(b) * 0 + 1;
  let resultTemp = select(zero, one, a >= b);
`,as=`
  let zero = sign(a) * 0 + 0;
  let one = sign(b) * 0 + 1;
  let resultTemp = select(zero, one, a < b);
`,us=`
  let zero = sign(a) * 0 + 0;
  let one = sign(b) * 0 + 1;
  let resultTemp = select(zero, one, a <= b);
`,ds="return f32(a >= 1.0 && b >= 1.0);",ls=`return (vec4<f32>(a >= vec4<f32>(1.0)) *
  vec4<f32>(b >= vec4<f32>(1.0)));`,cs="return f32(a >= 1.0 || b >= 1.0);",hs=`return min(vec4<f32>(a >= vec4<f32>(1.0)) +
  vec4<f32>(b >= vec4<f32>(1.0)), vec4<f32>(1.0));`,ps="let resultTemp = max(a, b);",ms="let resultTemp = min(a, b);",fs=`
  let isNaN = b == 0.;
  var resultTemp = a % b;
  resultTemp = select((resultTemp + b) % b, resultTemp,
      (a < 0. && b < 0.) || (a >= 0. && b > 0.));
`,gs=`
  let isNaN = !vec4<bool>(b);
  var resultTemp = vec4<f32>(a % b);
  if (!((a[0] < 0. && b[0] < 0.) || (a[0] >= 0. && b[0] > 0.))) {
    resultTemp[0] = (resultTemp[0] + b[0]) % b[0];
  }
  if (!((a[1] < 0. && b[1] < 0.) || (a[1] >= 0. && b[1] > 0.))) {
    resultTemp[1] = (resultTemp[1] + b[1]) % b[1];
  }
  if (!((a[2] < 0. && b[2] < 0.) || (a[2] >= 0. && b[2] > 0.))) {
    resultTemp[2] = (resultTemp[2] + b[2]) % b[2];
  }
  if (!((a[3] < 0. && b[3] < 0.) || (a[3] >= 0. && b[3] > 0.))) {
    resultTemp[3] = (resultTemp[3] + b[3]) % b[3];
  }
`,xs="let resultTemp = a * b;",Cs=`
  var resultTemp = f32(a != b);
  let valueForNaN = 1.0;
`,bs=`
  var resultTemp = vec4<f32>(a != b);
  let valueForNaN = 1.0;
`,ws=`
  let isNaN = a < 0.0 && floor(b) < b;
  if (b == 0.0) {
    return 1.0;
  }
  var resultTemp = select(sign(a) * pow(abs(a), b), pow(abs(a), b),
      round(abs(b) % 2.0) != 1.0);
`,Ss=`
  let isModRound1Bool = vec4<i32>(round(abs(b) % vec4<f32>(2.0))) == vec4<i32>(1);
  let isModRound1 = vec4<f32>(isModRound1Bool);
  let multiplier = sign(a) * isModRound1 + (vec4<f32>(1.0) - isModRound1);
  var resultTemp = multiplier * pow(abs(a), b);

  // Ensure that a^0 = 1, including 0^0 = 1 as this correspond to TF and JS
  let isExpZero = b == vec4<f32>(0.0);
  if (isExpZero.r) {
    resultTemp.r = 1.0;
  }
  if (isExpZero.g) {
    resultTemp.g = 1.0;
  }
  if (isExpZero.b) {
    resultTemp.b = 1.0;
  }
  if (isExpZero.a) {
    resultTemp.a = 1.0;
  }
  let isNaN = (a < vec4<f32>(0.0)) & (floor(b) < b);
`,ys="if (a < 0.0) { return b * a; }  return a;",vs=`
  let aLessThanZero = vec4<f32>(a < vec4<f32>(0.0));
  return (aLessThanZero * (b * a)) + ((vec4<f32>(1.0) - aLessThanZero) * a);
`,Is="let resultTemp = (a - b) * (a - b);",ks="let resultTemp = a - b;";function Le(s,t){let e;do{switch(s){case N.ATAN2:e=Zt;break;case N.MAX:e=ps;break;case N.MIN:e=ms;break;case N.MOD:e=t?gs:fs;break;case N.NOT_EQUAL:e=t?bs:Cs;break;case N.POW:e=t?Ss:ws;break;default:continue}let i,o,r;return t?(i="isnanVec4",o="vec4<f32>",r="vec4<bool>"):(i="isnan",o="f32",r="bool"),`
      let aIsNaN = ${i}(a);
      let aPostLegalization = select(a, ${o}(42), aIsNaN);
      let bIsNaN = ${i}(b);
      let bPostLegalization = select(b, ${o}(42), bIsNaN);
      let isNaN = false;
      let valueForNaN = uniforms.NAN;
      {
        let a = aPostLegalization;
        let b = bPostLegalization;
        ${e}
        return select(
            resultTemp, ${o}(valueForNaN),
            ${r}(isNaN) | aIsNaN | bIsNaN);
      }
    `}while(!1);switch(s){case N.ADD:e=Qt;break;case N.COMPLEX_MULTIPLY_IMAG:e=es;break;case N.COMPLEX_MULTIPLY_REAL:e=Jt;break;case N.DIV:e=ts;break;case N.ELU_DER:e=ss;break;case N.EQUAL:e=os;break;case N.FLOOR_DIV:e=is;break;case N.GREATER:e=rs;break;case N.GREATER_EQUAL:e=ns;break;case N.LESS:e=as;break;case N.LESS_EQUAL:e=us;break;case N.LOGICAL_AND:return t?ls:ds;case N.LOGICAL_OR:return t?hs:cs;case N.MUL:e=xs;break;case N.PRELU:return t?vs:ys;case N.SQUARED_DIFFERENCE:e=Is;break;case N.SUB:e=ks;break}return`
    ${e}
    return resultTemp;
  `}var S;(function(s){s[s.ABS=0]="ABS",s[s.ACOS=1]="ACOS",s[s.ACOSH=2]="ACOSH",s[s.ASIN=3]="ASIN",s[s.ASINH=4]="ASINH",s[s.ATAN=5]="ATAN",s[s.ATANH=6]="ATANH",s[s.CEIL=7]="CEIL",s[s.COS=8]="COS",s[s.COSH=9]="COSH",s[s.ELU=10]="ELU",s[s.ERF=11]="ERF",s[s.EXP=12]="EXP",s[s.EXPM1=13]="EXPM1",s[s.FLOOR=14]="FLOOR",s[s.IS_FINITE=15]="IS_FINITE",s[s.IS_INF=16]="IS_INF",s[s.IS_NAN=17]="IS_NAN",s[s.LINEAR=18]="LINEAR",s[s.LOG=19]="LOG",s[s.LOG1P=20]="LOG1P",s[s.LOGICAL_NOT=21]="LOGICAL_NOT",s[s.NEG=22]="NEG",s[s.RELU=23]="RELU",s[s.RELU6=24]="RELU6",s[s.LEAKYRELU=25]="LEAKYRELU",s[s.RECIPROCAL=26]="RECIPROCAL",s[s.ROUND=27]="ROUND",s[s.RSQRT=28]="RSQRT",s[s.SELU=29]="SELU",s[s.SIGMOID=30]="SIGMOID",s[s.SIGN=31]="SIGN",s[s.SIN=32]="SIN",s[s.SINH=33]="SINH",s[s.SOFTPLUS=34]="SOFTPLUS",s[s.SQRT=35]="SQRT",s[s.SQUARE=36]="SQUARE",s[s.STEP=37]="STEP",s[s.TAN=38]="TAN",s[s.TANH=39]="TANH",s[s.TO_INT=40]="TO_INT"})(S||(S={}));const Rs="return abs(a);",Ps=`
  if (abs(a) > 1.) {
    return uniforms.NAN;
  }
  return acos(a);
`,$s=`
  if (a < 1.) {
    return uniforms.NAN;
  }
  return acosh(a);
`,Ds=`
  if (abs(a) > 1.) {
    return uniforms.NAN;
  }
  return asin(a);
`,Ns="return asinh(a);",zs=`
  if (isnan(a)) {
    return uniforms.NAN;
  }
  return atan(a);
`,As=`
  if (abs(a) > 1.) {
    return uniforms.NAN;
  }
  if (a == 1.) {
    return uniforms.INFINITY;
  }
  if (a == -1.) {
    return -uniforms.INFINITY;
  }
  return atanh(a);
`,Fs="return ceil(a);",_s="return cos(a);",Ls=`
  let e2x = exp(-a);
  return (e2x + 1.0 / e2x) / 2.0;
`,Es="return exp(a) - 1.0;",Ts="if (a >= 0.0) { return a; }  return (exp(a) - 1.0);",Bs=`
  var resFloat = exp(a) - vec4<f32>(1.0);
  if (a.r >= 0.0) {
    resFloat.r = a.r;
  }
  if (a.g >= 0.0) {
    resFloat.g = a.g;
  }
  if (a.b >= 0.0) {
    resFloat.b = a.b;
  }
  if (a.a >= 0.0) {
    resFloat.a = a.a;
  }
  return resFloat;
`,Ws=`
  // Error function is calculated approximately with elementary function.
  // See "Handbook of Mathematical Functions with Formulas,
  // Graphs, and Mathematical Tables", Abramowitz and Stegun.
  let p = ${d.backend_util.ERF_P};
  let a1 = ${d.backend_util.ERF_A1};
  let a2 = ${d.backend_util.ERF_A2};
  let a3 = ${d.backend_util.ERF_A3};
  let a4 = ${d.backend_util.ERF_A4};
  let a5 = ${d.backend_util.ERF_A5};

  let sign = sign(a);
  let absA = abs(a);
  let t = 1.0 / (1.0 + p * absA);
  return sign * (1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * exp(-absA * absA));
`,Ms="return exp(a);",Vs="return floor(a);",Us="return f32(!isnan(a) && !isinf(a));",Os="return f32(isinf(a));",Gs="return f32(isnan(a));",Hs="return a;",Xs=`if (a < 0.0) { return uniforms.NAN; }
  return log(a);`,Ks=`
  if (isnan(a)) { return a; }
  return log(1.0 + a);
`,qs="return f32(!(a >= 1.0));",Ys="return -a;",js="if (a < 0.0) { return uniforms.alpha * a; } return a;",Qs=`
  let aLessThanZero = vec4<f32>(a < vec4<f32>(0.0));
  return (aLessThanZero * (uniforms.alpha * a)) + ((vec4<f32>(1.0) - aLessThanZero) * a);
`,Zs="return 1.0 / a;",Js="return select(a, 0.0, a < 0.0);",eo="return clamp(a, 0.0, 6.0);",to="return clamp(a, vec4<f32>(0.0, 0.0, 0.0, 0.0), vec4<f32>(6.0, 6.0, 6.0, 6.0));",so=`
  return select(a, vec4<f32>(0.0), a < vec4<f32>(0.0));
`,oo="return round(a);",io="return inverseSqrt(a);",ro=`
  if (a >= 0.0) {
    return ${d.backend_util.SELU_SCALE} * a;
  } else {
    return ${d.backend_util.SELU_SCALEALPHA} * (exp(a) - 1.0);
  }
`,no="return 1.0 / (1.0 + exp(-1.0 * a));",ao="return sign(a);",uo="return sin(a);",lo=`
  let e2x = exp(a);
  return (e2x - 1.0 / e2x) / 2.0;
`,co=`
  let epsilon = 1.1920928955078125e-7;
  let threshold = log(epsilon) + 2.0;

  let too_large = a > -threshold;
  let too_small = a < threshold;
  let exp_a = exp(a);

  if (too_large) {
    return a;
  } else if (too_small) {
    return exp_a;
  } else {
    return log(exp_a + 1.0);
  }
`,ho="return sqrt(a);",po="return a * a;",mo=`
  if (isnan(a)) {
    return a;
  }

  return select(uniforms.stepAlpha, 1.0, a > 0.0);
`,fo="return tan(a);",go=`
  let e2x = exp(-2.0 * abs(a));
  return sign(a) * (1.0 - e2x) / (1.0 + e2x);
`,xo="return f32(i32((a)));";function te(s,t){switch(s){case S.ABS:return Rs;case S.ACOS:return Ps;case S.ACOSH:return $s;case S.ASIN:return Ds;case S.ASINH:return Ns;case S.ATAN:return zs;case S.ATANH:return As;case S.COS:return _s;case S.COSH:return Ls;case S.CEIL:return Fs;case S.ELU:return t?Bs:Ts;case S.ERF:return Ws;case S.EXP:return Ms;case S.EXPM1:return Es;case S.FLOOR:return Vs;case S.IS_FINITE:return Us;case S.IS_INF:return Os;case S.IS_NAN:return Gs;case S.LINEAR:return Hs;case S.LOG:return Xs;case S.LOG1P:return Ks;case S.LOGICAL_NOT:return qs;case S.NEG:return Ys;case S.LEAKYRELU:return t?Qs:js;case S.RECIPROCAL:return Zs;case S.RELU:return t?so:Js;case S.RELU6:return t?to:eo;case S.ROUND:return oo;case S.RSQRT:return io;case S.SELU:return ro;case S.SIGMOID:return no;case S.SIGN:return ao;case S.SIN:return uo;case S.SINH:return lo;case S.SOFTPLUS:return co;case S.SQRT:return ho;case S.SQUARE:return po;case S.STEP:return mo;case S.TAN:return fo;case S.TANH:return go;case S.TO_INT:return xo;default:throw new Error(`BinaryType ${s} is not implemented!`)}}function Q(s,t=!1,e=!1,i=3){if(s===null)return"";let o="";if(s==="linear")o=te(S.LINEAR);else if(s==="relu")o=te(S.RELU,e);else if(s==="elu")o=te(S.ELU,e);else if(s==="relu6")o=te(S.RELU6,e);else if(s==="prelu")o=Le(N.PRELU,e);else if(s==="sigmoid")o=te(S.SIGMOID,e);else if(s==="leakyrelu")o=te(S.LEAKYRELU,e);else throw new Error(`Activation ${s} has not been implemented for the WebGPU backend.`);const n=z(e?4:1);let a="";return t?a=`
      fn activation(a : ${n}, coords : vec${i}<i32>) -> ${n} {
        let b = getPreluActivationWeightsByOutputCoords(coords);
        ${o}
      }`:a=`
      fn activation(a : ${n}, coords : vec${i}<i32>) -> ${n} {
        ${o}
      }`,a}function se(s,t){return`
      ${s?"value = value + getBiasByOutputCoords(coords);":""}
      ${t?"value = activation(value, coords);":""}
      `}function Qe(s,t,e=!1,i=!1,o=!1,r=1){d.util.assert(s&&r===1||!s,()=>`transposeA ${s} is not compatible with component size ${r}`);const n=`
      ${s?"value = getA(batch, col, row);":"value = getA(batch, row, col);"}

    `,a=t?"value = getB(batch, col, row);":"value = getB(batch, row, col);";return`
  fn mm_readA(batch: i32, row: i32, col: i32) -> ${z(r)} {
    var value = ${z(r)}(0.0);
    ${e&&o?n:`
    ${s?"if(row < uniforms.dimAOuter && col < uniforms.dimInner)":"if(row < uniforms.aShape[1] && col < uniforms.aShape[2])"}
    {
      ${n}
    }
    `}
    return value;
  }

  fn mm_readB(batch: i32, row: i32, col: i32) -> ${z(r)} {
    var value = ${z(r)}(0.0);
    ${a}
    return value;
  }
  `}function Ee(s,t,e,i,o=!1,r=!1,n=!1,a=1){return`
  ${Qe(e,i,o,r,n,a)}
  fn mm_write(batch: i32, row: i32, col: i32, valueIn: ${z(a)}) {
    ${o&&r?"":"if (row < uniforms.dimAOuter && col < uniforms.dimBOuter)"}
    {
      var value = valueIn;
      let coords = vec3<i32>(batch, row, col);
      ${se(s,t)}
      setOutputAtCoords(coords[0], coords[1], coords[2], value);
    }
  }
  `}const Co=(s,t)=>s?`
        mm_Asub[inputRow][inputCol] = mm_readA(batchA,
          kStart + inputRow,
          globalRowStart + inputCol * ${t});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batchA,
          globalRow + innerRow,
          kStart + inputCol * ${t});
        `,bo=(s,t,e,i)=>{if(s)return`
      for (var k = 0; k < ${i}; k++) {
        let BCached0 = mm_Bsub[k][tileCol];
        let ACached0 = mm_Asub[k][localRow];
        for (var i = 0; i < ${e}; i++) {
          acc[i] = fma(BCached0, vec4<f32>(ACached0[i]), acc[i]);
        }
      }`;{let o="",r="";for(let n=0;n<t;n++)o+=`let BCached${n} = mm_Bsub[k * ${t} + ${n}][tileCol];`,r+=`acc[i] = fma(BCached${n}, vec4<f32>(ACached[${n}]), acc[i]);`;return`
      for (var k = 0; k < ${i/t}; k++) {
        ${o}
        for (var i = 0; i < ${e}; i++) {
          let ACached = mm_Asub[tileRow + i][k];
          ${r}
        }
      }`}};function ye(s,t,e=!1,i=32,o=!1,r=32,n=!1){const a=t[1]*s[1],u=t[0]*s[0],l=e?a:i,c=e?i:a,h=l/t[0],p=i/t[1],m=s[1],f=s[0];return d.util.assert((e&&h===4&&s[1]===4||!e&&(h===3||h===4))&&l%t[0]===0&&i%t[1]===0&&s[0]===4,()=>`If transposeA ${e} is true, innerElementSize ${h} and workPerThread[1] ${s[1]} must be 4.
          Otherwise, innerElementSize ${h} must be 3 or 4.
      tileAWidth ${l} must be divisible by workgroupSize[0]${t[0]}. tileInner ${i} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${s[0]} must be 4.`),`
  var<workgroup> mm_Asub : array<array<vec${h}<f32>, ${l/h}>, ${c}>;
  var<workgroup> mm_Bsub : array<array<vec4<f32>, ${u/s[0]}>, ${i}>;

  ${y()} {
    let localRow = i32(localId.y);
    let tileRow = localRow * ${m};
    let tileCol = i32(localId.x);

    let globalRow = i32(globalId.y) * ${m};
    let globalCol = i32(globalId.x) * ${f};
    let batch = ${o?"0":"i32(globalId.z)"};
    let batchA = ${o||!n?"batch":"batch % uniforms.aShape[0]"};
    let batchB = ${o||!n?"batch":"batch % uniforms.bShape[0]"};
    let globalRowStart = i32(workgroupId.y) * ${a};

    let numTiles = ${o?`${Math.ceil(r/i)}`:`(uniforms.dimInner - 1) / ${i} + 1`};
    var kStart = ${o?`i32(globalId.z) * ${r}`:"0"};

    var acc: array<vec4<f32>, ${m}>;

    // Loop over shared dimension.
    let tileRowB = localRow * ${p};
    for (var t = 0; t < numTiles; t++) {
        // Load one tile of A into local memory.
        for (var innerRow = 0; innerRow < ${m}; innerRow++) {
            let inputRow = tileRow + innerRow;
            let inputCol = tileCol;
            ${Co(e,h)}
        }

        // Load one tile of B into local memory.
        for (var innerRow = 0; innerRow < ${p}; innerRow++) {
            let inputRow = tileRowB + innerRow;
            let inputCol = tileCol;
            mm_Bsub[inputRow][inputCol] = mm_readB(batchB, kStart + inputRow, globalCol);
        }
        kStart = kStart + ${i};
        workgroupBarrier();

        // Compute acc values for a single thread.
        ${bo(e,h,m,i)}
        workgroupBarrier();
    }

    for (var innerRow = 0; innerRow < ${m}; innerRow++) {
        mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
    }
  }`}const Ze=s=>s?`
        mm_Asub[inputRow][inputCol] = mm_readA(batchA,
          kStart + inputRow,
          globalRowStart + inputCol);
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batchA,
          globalRowStart + inputRow,
          kStart + inputCol);
        `,wo=s=>s?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];";function ve(s,t,e=!1,i=32,o=!1,r=32,n=!1,a=!1){const u=s[1]*t[1],l=s[0]*t[0],c=e?u:i,h=e?i:u;d.util.assert(h%t[1]===0&&c%t[0]===0&&i%t[1]===0,()=>`tileAHight ${h} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${c} must be divisible by workgroupSize[0]${t[0]}, tileInner ${i} must be divisible by workgroupSize[1]${t[1]}`);const p=h/t[1],m=c/t[0],f=i/t[1],g=s[1],x=s[0],C=n?`
      let localRow = i32(localId.y);
      let localCol = i32(localId.x);
      let globalRowStart = i32(workgroupId.y) * ${u};
      let globalColStart = i32(workgroupId.x) * ${l};

      // Loop over shared dimension.
      for (var t = 0; t < numTiles; t++) {
        // Load one tile of A into local memory.
        for (var inputRow = localRow; inputRow < ${h}; inputRow = inputRow + ${t[1]}) {
          for (var inputCol = localCol; inputCol < ${c}; inputCol = inputCol + ${t[0]}) {
            ${Ze(e)}
          }
        }
        // Load one tile of B into local memory.
        for (var inputRow = localRow; inputRow < ${i}; inputRow = inputRow + ${t[1]}) {
              for (var inputCol = localCol; inputCol < ${l}; inputCol = inputCol + ${t[0]}) {
            mm_Bsub[inputRow][inputCol] = mm_readB(batchB,
              kStart + inputRow,
              globalColStart + inputCol);
          }
        }
        kStart = kStart + ${i};
        workgroupBarrier();

        // Compute acc values for a single thread.
        var BCached : array<f32, ${x}>;
        for (var k = 0; k < ${i}; k++) {
          for (var inner = 0; inner < ${x}; inner++) {
            BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
          }
          for (var innerRow = 0; innerRow < ${g}; innerRow++) {
            let ACached = ${e?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
            for (var innerCol = 0; innerCol < ${x}; innerCol++) {
              acc[innerRow][innerCol] =
                  fma(ACached, BCached[innerCol], acc[innerRow][innerCol]);
            }
          }
        }
        workgroupBarrier();
      }
      for (var innerRow = 0; innerRow < ${g}; innerRow++) {
        let gRow = globalRowStart + localRow + innerRow * ${t[1]};
        for (var innerCol = 0; innerCol < ${x}; innerCol++) {
          let gCol = globalColStart + localCol + innerCol * ${t[0]};
          mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
        }
      }
      `:`
  let tileRow = i32(localId.y) * ${g};
  let tileCol = i32(localId.x) * ${x};

  let globalRow = i32(globalId.y) * ${g};
  let globalCol = i32(globalId.x) * ${x};
  let globalRowStart = i32(workgroupId.y) * ${u};

  let tileRowA = i32(localId.y) * ${p};
  let tileColA = i32(localId.x) * ${m};
  let tileRowB = i32(localId.y) * ${f};
  // Loop over shared dimension.
  for (var t = 0; t < numTiles; t++) {
    // Load one tile of A into local memory.
    for (var innerRow = 0; innerRow < ${p}; innerRow++) {
      for (var innerCol = 0; innerCol < ${m}; innerCol++) {
        let inputRow = tileRowA + innerRow;
        let inputCol = tileColA + innerCol;
        ${Ze(e)}
      }
    }

    // Load one tile of B into local memory.
    for (var innerRow = 0; innerRow < ${f}; innerRow++) {
      for (var innerCol = 0; innerCol < ${x}; innerCol++) {
        let inputRow = tileRowB + innerRow;
        let inputCol = tileCol + innerCol;
        mm_Bsub[inputRow][inputCol] = mm_readB(batchB,
          kStart + inputRow,
          globalCol + innerCol);
      }
    }
    kStart = kStart + ${i};
    workgroupBarrier();

    // Compute acc values for a single thread.
    var BCached : array<f32, ${x}>;
    for (var k = 0; k < ${i}; k++) {
      for (var inner = 0; inner < ${x}; inner++) {
        BCached[inner] = mm_Bsub[k][tileCol + inner];
      }

      for (var innerRow = 0; innerRow < ${g}; innerRow++) {
        ${wo(e)}
        for (var innerCol = 0; innerCol < ${x}; innerCol++) {
          acc[innerRow][innerCol] =
              fma(ACached, BCached[innerCol], acc[innerRow][innerCol]);
        }
      }
    }

    workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < ${g}; innerRow++) {
    for (var innerCol = 0; innerCol < ${x}; innerCol++) {
      mm_write(batch, globalRow + innerRow, globalCol + innerCol,
          acc[innerRow][innerCol]);
    }
  }
  `;return`
    var<workgroup> mm_Asub : array<array<f32, ${c}>, ${h}>;
    var<workgroup> mm_Bsub : array<array<f32, ${l}>, ${i}>;

    ${y()} {
      let batch = ${o?"0":"i32(globalId.z)"};
      let batchA = ${o||!a?"batch":"batch % uniforms.aShape[0]"};
      let batchB = ${o||!a?"batch":"batch % uniforms.bShape[0]"};
      let numTiles = ${o?`${Math.ceil(r/i)}`:`(uniforms.dimInner - 1) / ${i} + 1`};
      var kStart = ${o?`i32(globalId.z) * ${r}`:"0"};

      var acc : array<array<f32, ${x}>, ${g}>;

      // Without this initialization strange values show up in acc.
      for (var innerRow = 0; innerRow < ${g}; innerRow++) {
        for (var innerCol = 0; innerCol < ${x}; innerCol++) {
          acc[innerRow][innerCol] = 0.0;
        }
      }
      ${C}
    }
  `}const So=s=>s?`
      mm_readA(batchA, colA, globalRow),
      mm_readA(batchA, colA + 1, globalRow),
      mm_readA(batchA, colA + 2, globalRow),
      mm_readA(batchA, colA + 3, globalRow)
  `:`
      mm_readA(batchA, globalRow, colA),
      mm_readA(batchA, globalRow, colA + 1),
      mm_readA(batchA, globalRow, colA + 2),
      mm_readA(batchA, globalRow, colA + 3)
  `;function yo(s,t=!1){d.util.assert(s[1]===1&&s[2]===1,()=>`A linear work group size is required. But got ${s}.`);const e=s[0]*4;return`
    var<workgroup> mm_Asub : array<vec4<f32>, ${s[0]}>;

    ${y()} {
      let tileCol = i32(localId.x);
      let globalCol = i32(globalId.x);
      let globalRow = i32(globalId.y);

      let numTiles = (uniforms.dimInner - 1) / ${e} + 1;
      let batch = i32(globalId.z);
      let batchA = batch % uniforms.aShape[0];
      let batchB = batch % uniforms.bShape[0];
      // Without this initialization strange values show up in acc.
      var acc = 0.0;

      // Loop over shared dimension.
      for (var t = 0; t < numTiles; t++) {
        // Load one tile of A into local memory.
        let colA = t * ${e} + tileCol * 4;
        mm_Asub[tileCol] = vec4<f32>(${So(t)});
        workgroupBarrier();

        // Compute acc values for a single thread.
        for (var k = 0; k < ${e/4}; k++) {
          let rowB = t * ${e} + k * 4;
          let BCached = vec4<f32>(mm_readB(batchB, rowB, globalCol),
                              mm_readB(batchB, rowB + 1, globalCol),
                              mm_readB(batchB, rowB + 2, globalCol),
                              mm_readB(batchB, rowB + 3, globalCol));

          let ACached = mm_Asub[k];
          acc = acc + dot(ACached, BCached);
        }

        workgroupBarrier();
      }

      mm_write(batch, globalRow, globalCol, acc);
    }
  `}class vo{constructor(t,e,i=!1,o=!1,r=null,n=null,a=null,u=!1){this.variableNames=["A","B"],this.uniforms="dimAOuter : i32, dimBOuter : i32, dimInner : i32,",this.outputShape=e,this.dispatchLayout={x:[2],y:[1],z:[0]};const l=i?t[1]:t[2];if(this.isVec4=(l%4===0&&!i||e[1]%4===0&&i)&&e[2]%4===0&&!o,this.outputComponent=this.isVec4?4:1,this.isVectorA=e[1]===1&&!i,!this.isVec4&&this.isVectorA)this.elementsPerThread=[1,1,1],this.workgroupSize=[32,1,1];else{const p=je(e[1],l,e[2],i);this.workgroupSize=p.workgroupSize,this.elementsPerThread=p.elementsPerThread}this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,this.elementsPerThread);const c=r!=null,h=a!=null;c&&this.variableNames.push("bias"),h&&this.variableNames.push("preluActivationWeights"),this.sequentialAccessByThreads=u,this.transposeA=i,this.transposeB=o,this.addBias=c,this.activation=n,this.hasPreluActivationWeights=h,[this.fitAOuter,this.fitBOuter,this.fitInner]=this.getShapeFit(e[1],e[2],l),this.shaderKey=`matMulPacked_${this.elementsPerThread}_${i}_${o}_${this.activation}_${this.fitAOuter}_${this.fitBOuter}_${this.fitInner}_${this.isVec4}_${this.isVectorA}_${this.sequentialAccessByThreads}`}getShapeFit(t,e,i){const o=this.workgroupSize[1]*this.elementsPerThread[1],r=this.workgroupSize[0]*this.elementsPerThread[0];!this.isVec4&&this.isVectorA?this.tileInner=this.workgroupSize[0]*4:this.tileInner=r;const n=t%o===0,a=e%r===0,u=i%this.tileInner===0;return[n,a,u]}getUserCode(){return`
      ${Q(this.activation,this.hasPreluActivationWeights,this.isVec4)}
      ${Ee(this.addBias,this.activation,!1,this.transposeB,this.fitAOuter,this.fitBOuter,this.fitInner,this.isVec4?4:1)}
      ${this.isVec4?ye(this.elementsPerThread,this.workgroupSize,this.transposeA,this.tileInner,!1,null,!0):this.isVectorA?yo(this.workgroupSize,this.transposeA):ve(this.elementsPerThread,this.workgroupSize,this.transposeA,this.tileInner,!1,null,this.sequentialAccessByThreads,!0)}
    `}}function Io(s){return`
    var<workgroup> sumValues : array<f32, ${s}>;
    ${y()} {
      let coords = getOutputCoords();
      let batch = coords[0];
      let batchA = batch % uniforms.aShape[0];
      let batchB = batch % uniforms.bShape[0];
      let row = coords[1];
      let col = coords[2];
      var sum = 0.0;
      let Length = uniforms.dimInner;
      for (var k = i32(localId.x); k < Length; k = k + ${s}) {
        let dataA = mm_readA(batchA, row, k);
        let dataB = mm_readB(batchB, k, col);
        sum = sum + dataA * dataB;
      }
      sumValues[localId.x] = sum;
      workgroupBarrier();

      for(var currentSize = ${s/2}u; currentSize > 1u;
          currentSize = currentSize / 2u) {
        if (localId.x < currentSize)
        {
          sumValues[localId.x] = sumValues[localId.x] + sumValues[localId.x + currentSize];
        }
        workgroupBarrier();
      }

      if (localId.x == 0u) {
        sum = sumValues[0] + sumValues[1];
        mm_write(batch, row, col, sum);
      }
    }
  `}class ko{constructor(t,e=!1,i=!1,o=null,r=null,n=null){this.variableNames=["A","B"],this.uniforms="dimAOuter : i32, dimBOuter : i32, dimInner : i32,",this.workgroupSize=[256,1,1],this.outputShape=t,this.dispatchLayout={x:[],y:[1,2],z:[0]},this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize);const a=o!=null,u=n!=null;a&&this.variableNames.push("bias"),u&&this.variableNames.push("preluActivationWeights"),this.transposeA=e,this.transposeB=i,this.addBias=a,this.activation=r,this.hasPreluActivationWeights=u,this.shaderKey=`matMulReduce_${this.activation}_${e}_${i}`}getUserCode(){return`
      ${Q(this.activation,this.hasPreluActivationWeights)}
      ${Ee(this.addBias,this.activation,this.transposeA,this.transposeB)}
      ${Io(this.workgroupSize[0])}
    `}}function Ro(s){const t=s[1],e=s[0],i=t>e?t:e;return`
  var<workgroup> mm_Asub : array<array<f32, ${i}>, ${t}>;
  var<workgroup> mm_Bsub : array<array<f32, ${e}>, ${i}>;

  // If the output size is small for matrix multiplication, avoid to use vec4
  // and handle some elements per thread to optimally utilize the ALU.
  // Read data from global memory to registers firstly, then store them into
  // shared memory, so it is instruction-Level parallelism for arithmetic
  // operations and others handle IO operations between barrier api, makes ALU
  // and load/store units work simultaneously, could improves the performance.
  ${y()} {
    let tileRow = i32(localId.y);
    let tileCol = i32(localId.x);
    let globalRow = i32(globalId.y);
    let globalCol = i32(globalId.x);
    let batch = i32(globalId.z);
    let batchA = batch % uniforms.aShape[0];
    let batchB = batch % uniforms.bShape[0];

    // uniforms.dimInner should be greater than 0.
    let numTiles = (uniforms.dimInner - 1) / ${i} + 1;
    var acc = 0.0;

    var globalColA = tileCol;
    var globalRowB = 0;
    var regA = mm_readA(batchA, globalRow, globalColA);
    var regB0 = mm_readB(batchB, globalRowB + 2 * tileRow, globalCol);
    var regB1 = mm_readB(batchB, globalRowB + 2 * tileRow + 1, globalCol);
    globalColA = globalColA + ${i};
    globalRowB = globalRowB + ${i};

    for (var t = 0; t < numTiles; t = t + 1) {
      mm_Asub[tileRow][tileCol] = regA;
      mm_Bsub[2 * tileRow][tileCol] = regB0;
      mm_Bsub[2 * tileRow + 1][tileCol] = regB1;

      workgroupBarrier();

      regA = mm_readA(batchA, globalRow, globalColA);
      regB0 = mm_readB(batchB, globalRowB + 2 * tileRow, globalCol);
      regB1 = mm_readB(batchB, globalRowB + 2 * tileRow + 1, globalCol);
      globalColA = globalColA + ${i};
      globalRowB = globalRowB + ${i};

      for (var k = 0; k < ${i}; k = k + 1) {
        acc = acc + mm_Asub[tileRow][k] * mm_Bsub[k][tileCol];
      }
      workgroupBarrier();
    }

    mm_write(batch, globalRow, globalCol, acc);
  }
  `}class Po{constructor(t,e,i,o=!1,r=!1,n=null,a=null,u=null){this.variableNames=["A","B"],this.uniforms="dimAOuter : i32, dimBOuter : i32, dimInner : i32,",this.workgroupSize=[16,8,1],this.outputShape=i,this.dispatchLayout={x:[2],y:[1],z:[0]},this.dispatch=[Math.ceil(i[2]/this.workgroupSize[0]),Math.ceil(i[1]/this.workgroupSize[1]),i[0]];const l=n!=null;l&&this.variableNames.push("bias");const c=u!=null;c&&this.variableNames.push("preluActivationWeights"),this.transposeA=o,this.transposeB=r,this.addBias=l,this.activation=a,this.hasPreluActivationWeights=c,this.shaderKey=`matMulSmallOutputSize_${this.activation}_${o}_${r}`}getUserCode(){return`
      ${Q(this.activation,this.hasPreluActivationWeights)}
      ${Ee(this.addBias,this.activation,this.transposeA,this.transposeB)}
      ${Ro(this.workgroupSize)}
    `}}class $o{constructor(t,e,i=!1,o=!1){this.variableNames=["A","B"],this.uniforms="dimAOuter : i32, dimBOuter : i32, dimInner : i32,",this.workgroupSize=[8,8,1],this.atomic=!0,this.splitedDimInner=128,d.util.assert(t[0]===1,()=>"MatMulSplitKProgram only supports batch = 1."),this.outputShape=t,this.dispatchLayout={x:[2],y:[1],z:[0,3]};const r=(i&&this.outputShape[1]%4===0||!i&&e%4===0)&&this.outputShape[2]%4===0;this.elementsPerThread=[4,4,this.splitedDimInner],this.outputComponent=r?4:1,r||(this.outputShape[1]<16&&(this.elementsPerThread[1]=1),this.outputShape[2]<16&&(this.elementsPerThread[0]=1)),this.dispatch=v(this.dispatchLayout,[this.outputShape[0],this.outputShape[1],this.outputShape[2],e],this.workgroupSize,this.elementsPerThread),this.transposeA=i,this.transposeB=o,this.shaderKey=`matMulSplitK_${i}_${o}_${this.elementsPerThread}_${this.outputComponent}`}getUserCode(){const t=this.outputComponent;return`
      ${Qe(!1,this.transposeB,!1,!1,!1,t)}
      fn mm_write(batch: i32, row : i32, col : i32, value : ${z(t)}) {
        if (row < uniforms.dimAOuter && col < uniforms.dimBOuter) {
          let coords = vec3<i32>(batch, row, col);
          let flatIndex = getOutputIndexFromCoords(coords);
          // The problem is that we should initialize output to zero before using.
          // Otherwise, the original value will be added to the result.
          for (var i = 0; i < ${t}; i = i + 1) {
            ${Z("&result[flatIndex + i]",`${t>1?"value[i]":"value"}`,"float32")}
          }
        }
      }
      ${t===4?ye(this.elementsPerThread,this.workgroupSize,this.transposeA,32,!0,this.splitedDimInner):ve(this.elementsPerThread,this.workgroupSize,this.transposeA,32,!0,this.splitedDimInner)}
    `}}class Do{constructor(t,e=null,i=null,o=null){this.uniforms="",this.variableNames=["x"],this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.addBias=e!=null,this.hasPreluActivationWeights=o!=null,this.activation=i,this.addBias&&this.variableNames.push("bias"),this.hasPreluActivationWeights&&this.variableNames.push("preluActivationWeights"),this.shaderKey=`biasActivation_${i}`}getUserCode(){return`
    ${Q(this.activation,this.hasPreluActivationWeights)}
    ${y("index")} {
      if (index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        var value = getXByOutputIndex(index);
        ${se(this.addBias,this.activation)}
        setOutputAtIndex(index, value);
      }
    }
    `}}class No{constructor(t){this.variableNames=[],this.outputShape=[],this.uniforms="value : f32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="fill"}getUserCode(){return`
    ${y("index")} {
      if (index < uniforms.size) {
        setOutputAtIndex(index, uniforms.value);
      }
    }
  `}}function G(s){const{backend:t,attrs:e}=s,{shape:i,value:o}=e;let{dtype:r}=e;if(r=r||d.util.inferDtype(o),r==="string"){const n=d.util.getArrayFromDType(r,d.util.sizeFromShape(i));return n.fill(o),t.makeTensorInfo(i,r,n)}else{const n=new No(i),a=[{type:"float32",data:[o]}];return t.runWebGPUProgram(n,[],r,a)}}const zo={kernelName:d.Fill,backendName:"webgpu",kernelFunc:G};function P(s){const{inputs:t,attrs:e}=s,{x:i}=t,{shape:o}=e,r=d.util.sizeFromShape(i.shape),n=d.util.inferFromImplicitShape(o,r),a=d.util.sizeFromShape(n);return d.util.assert(r===a,()=>`The new shape (${n}) has ${a} elements and the old shape (${i.shape}) has ${r} elements. The new shape and old shape must have the same number of elements.`),s.backend.incRef(i.dataId),{dataId:i.dataId,shape:n,dtype:i.dtype}}const Ao={kernelName:d.Reshape,backendName:"webgpu",kernelFunc:P};function Ie({a:s,b:t,transposeA:e,transposeB:i,backend:o,bias:r=null,preluActivationWeights:n=null,leakyreluAlpha:a=0,activation:u=null}){const l=s.shape.length,c=t.shape.length,h=e?s.shape[l-2]:s.shape[l-1],p=i?t.shape[c-1]:t.shape[c-2],m=e?s.shape[l-1]:s.shape[l-2],f=i?t.shape[c-2]:t.shape[c-1],g=s.shape.slice(0,-2),x=t.shape.slice(0,-2),C=d.util.sizeFromShape(g),b=d.util.sizeFromShape(x),I=d.broadcast_util.assertAndGetBroadcastShape(s.shape.slice(0,-2),t.shape.slice(0,-2)).concat([m,f]);d.util.assert(h===p,()=>`Error in matMul: inner shapes (${h}) and (${p}) of Tensors with shapes ${s.shape} and ${t.shape} and transposeA=${e} and transposeB=${i} must match.`);const k=e?[C,h,m]:[C,m,h],$=i?[b,f,p]:[b,p,f],D=P({inputs:{x:s},backend:o,attrs:{shape:k}}),F=P({inputs:{x:t},backend:o,attrs:{shape:$}}),A=[D,F],E=Math.max(C,b),T=[D,F],O=[{type:"int32",data:[m]},{type:"int32",data:[f]},{type:"int32",data:[h]}];let V,B;const M=[E,m,f];let U=d.env().get("WEBGPU_MATMUL_PROGRAM_TYPE");if(U<0){const ce=d.env().getNumber("WEBGPU_THRESHOLD_TO_INCREASE_WORKGROUPS_FOR_MATMUL"),Ce=ce>0?ce:o.thresholdToIncreaseWorkgroups,be=E*Math.ceil(m/32)*Math.ceil(f/32);be<=Ce||m<=8&&be<=Ce*2?E*m*f<=128?U=q.MatMulReduceProgram:E===1&&p>=2e3?U=q.MatMulSplitKProgram:U=q.MatMulSmallOutputSizeProgram:U=q.MatMulPackedProgram}switch(U){case q.MatMulReduceProgram:V=new ko(M,e,i,r,u,n);break;case q.MatMulSplitKProgram:{if(B=G({backend:o,attrs:{shape:M,value:0,dtype:s.dtype}}),V=new $o(M,p,e,i),r||u){B=o.runWebGPUProgram(V,T,s.dtype,O,B);const Ce=new Do(B.shape,r,u,n);let be=null;const De=[B];r&&De.push(r),n&&De.push(n),u==="leakyrelu"&&(be=[{type:"float32",data:[a]}],Ce.uniforms+=" alpha : f32,");const Dt=o.runWebGPUProgram(Ce,De,B.dtype,be);A.push(B);const qc=P({inputs:{x:Dt},backend:o,attrs:{shape:I}});A.push(Dt);for(const Yc of A)o.disposeData(Yc.dataId);return qc}break}case q.MatMulSmallOutputSizeProgram:V=new Po(k,$,M,e,i,r,u,n);break;case q.MatMulPackedProgram:const ce=o.adapterInfo.isIntel();V=new vo(k,M,e,i,r,u,n,ce);break;default:throw new Error(`Unsupported MatMulProgramType ${U}.`)}r&&T.push(r),n&&T.push(n),u==="leakyrelu"&&(O.push({type:"float32",data:[a]}),V.uniforms+=" alpha : f32,"),B=o.runWebGPUProgram(V,T,s.dtype,O,B);const Kc=P({inputs:{x:B},backend:o,attrs:{shape:I}});A.push(B);for(const ce of A)o.disposeData(ce.dataId);return Kc}function Fo(s){const{inputs:t,backend:e,attrs:i}=s,{a:o,b:r,bias:n,preluActivationWeights:a}=t,{transposeA:u,transposeB:l,activation:c,leakyreluAlpha:h}=i;return Ie({a:o,b:r,transposeA:u,transposeB:l,backend:e,bias:n,preluActivationWeights:a,leakyreluAlpha:h,activation:c})}const _o={kernelName:d._FusedMatMul,backendName:"webgpu",kernelFunc:Fo};class Je{constructor(t,e,i){this.variableNames=["AReal","AImag","BReal","BImag"],this.workgroupSize=[128,1,1],this.size=!0,this.outputShape=d.backend_util.assertAndGetBroadcastShape(e,i),this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey=`binaryOpComplex_${t}`,this.op=t}getUserCode(){return`
      fn binaryOpComplex(
          areal : f32, aimag : f32, breal : f32, bimag : f32) -> f32 {
        ${Le(this.op,!1)}
      }

      ${y("index")} {
        if(index < uniforms.size) {
          let areal = getARealByOutputIndex(index);
          let aimag = getAImagByOutputIndex(index);
          let breal = getBRealByOutputIndex(index);
          let bimag = getBImagByOutputIndex(index);
          setOutputAtIndex(index, binaryOpComplex(areal, aimag, breal, bimag));
        }
      }
    `}}class ke{constructor(t,e,i){if(this.size=!0,this.variableNames=["A","B"],this.outputShape=d.backend_util.assertAndGetBroadcastShape(e,i),this.dispatchLayout=R(this.outputShape),this.op=t,this.useSharedMemoryWithA=e.length<=1&&i.length>1&&e[0]<128,this.useSharedMemoryWithB=i.length<=1&&e.length>1&&i[0]<128,this.useSharedMemoryWithA||this.useSharedMemoryWithB)this.outputComponent=1,this.variableComponents=[1,1],this.lastDimensionSize=this.useSharedMemoryWithB?i[0]:e[0],this.shaderKey=`binary_${t}_${this.lastDimensionSize}`,this.type="shared",this.workgroupSize=[256,1,1];else{const o=e.length>0&&e[e.length-1]%4===0,r=i.length>0&&i[i.length-1]%4===0;o&&r?(this.outputComponent=4,this.variableComponents=[4,4]):o&&(d.util.isScalarShape(i)||i[i.length-1]===1)||r&&(d.util.isScalarShape(e)||e[e.length-1]===1)?(this.outputComponent=4,this.variableComponents=o?[4,1]:[1,4]):(this.outputComponent=1,this.variableComponents=[1,1]),this.type="nonshared",this.shaderKey=`binary_${t}_${this.variableComponents}`,this.workgroupSize=[128,1,1]}this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,[this.outputComponent,1,1])}getUserCode(){let t;const e=this.outputComponent===4?"vec4<f32>":"f32",i=`
    fn binaryOperation(a : ${e}, b : ${e}) -> ${e} {
      ${Le(this.op,this.outputComponent===4)}
    };
    `;if(this.type==="shared"){const o=this.lastDimensionSize>1?`coords[${this.outputShape.length-1}]`:"0",r=this.useSharedMemoryWithB?`let a = getAByOutputIndex(index);
          let b = sharedBuf[${o}];`:`let a = sharedBuf[${o}];
          let b = getBByOutputIndex(index);`;t=`
        ${i}
        var<workgroup> sharedBuf : array<f32, ${this.lastDimensionSize}>;
        ${y("index")} {
          // Fill in the shared memory buffer.
          let localIndex = i32(localId.x);
          if(localIndex < ${this.lastDimensionSize}) {
            sharedBuf[localIndex] = f32(${this.useSharedMemoryWithB?"B":"A"}[localIndex]);
          }
          workgroupBarrier();

          if(index < uniforms.size) {
            let coords = getCoordsFromIndex(index);
            ${r}
            setOutputAtIndex(index, binaryOperation(a, b));
          }
        }
        `}else t=`
       ${i}
       ${y("index")} {
         if (index < uniforms.size) {
           let coords = getCoordsFromIndex(index * ${this.outputComponent});
           let a = ${e}(getAByOutputCoords(coords));
           let b = ${e}(getBByOutputCoords(coords));
           setOutputAtIndex(index, binaryOperation(a, b));
         }
       }
       `;return t}}function H(s){const{inputs:t}=s,{x:e}=t;return s.backend.incRef(e.dataId),{dataId:e.dataId,shape:e.shape,dtype:e.dtype}}const Lo={kernelName:d.Identity,backendName:"webgpu",kernelFunc:H};function oe(s){const{inputs:t,backend:e}=s,{real:i,imag:o}=t,r=e.makeTensorInfo(i.shape,"complex64"),n=e.tensorMap.get(r.dataId),a=H({inputs:{x:i},backend:e}),u=H({inputs:{x:o},backend:e});return n.complexTensorInfos={real:a,imag:u},r}const Eo={kernelName:d.Complex,backendName:"webgpu",kernelFunc:oe};class ne{constructor(t,e,i=""){this.variableNames=["A"],this.size=!0;const o=128;this.workgroupSize=[o,1,1],this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.op=e,i!==""&&(this.uniforms=i),this.shaderKey=`unary_${e}`}getUserCode(){return`
      fn unaryOperation(a : f32) -> f32 {
        ${te(this.op,!1)}
      }
      ${y("index")} {
        if (index < uniforms.size) {
          let a = getAByOutputIndex(index);
          setOutputAtIndex(index, unaryOperation(a));
        }
      }
      `}}function _({opType:s,cpuKernelImpl:t,dtype:e}){return({inputs:i,backend:o})=>{const{x:r}=i,n=o,a=e||r.dtype;if(n.shouldExecuteOnCPU([r])&&t!=null){const l=n.tensorMap.get(r.dataId),c=t(l.values,a);return n.makeTensorInfo(r.shape,a,c)}const u=new ne(r.shape,s);return n.runWebGPUProgram(u,[r],a)}}function W({opType:s,cpuKernelImpl:t,supportsComplex:e=!1,dtype:i}){return({inputs:o,backend:r})=>{const{a:n,b:a}=o,u=r;if(e&&n.dtype==="complex64"){const h=u.tensorMap.get(n.dataId),p=u.tensorMap.get(a.dataId);let m,f;if(s!==N.MUL)[m,f]=[[h.complexTensorInfos.real,p.complexTensorInfos.real],[h.complexTensorInfos.imag,p.complexTensorInfos.imag]].map(x=>{const[C,b]=x,w={dataId:C.dataId,dtype:C.dtype,shape:n.shape},I={dataId:b.dataId,dtype:b.dtype,shape:a.shape},k=new ke(s,n.shape,a.shape);return u.runWebGPUProgram(k,[w,I],d.upcastType(C.dtype,b.dtype))});else{const x=new Je(N.COMPLEX_MULTIPLY_REAL,n.shape,a.shape),C=new Je(N.COMPLEX_MULTIPLY_IMAG,n.shape,a.shape),b=[{dataId:h.complexTensorInfos.real.dataId,dtype:h.complexTensorInfos.real.dtype,shape:n.shape},{dataId:h.complexTensorInfos.imag.dataId,dtype:h.complexTensorInfos.imag.dtype,shape:n.shape},{dataId:p.complexTensorInfos.real.dataId,dtype:p.complexTensorInfos.real.dtype,shape:a.shape},{dataId:p.complexTensorInfos.imag.dataId,dtype:p.complexTensorInfos.imag.dtype,shape:a.shape}];m=u.runWebGPUProgram(x,b,"float32"),f=u.runWebGPUProgram(C,b,"float32")}const g=oe({inputs:{real:m,imag:f},backend:u});return u.disposeData(m.dataId),u.disposeData(f.dataId),g}const l=i||d.upcastType(n.dtype,a.dtype);if((n.dtype==="string"||a.dtype==="string"||u.shouldExecuteOnCPU([n,a]))&&t!=null){const h=u.tensorMap.get(n.dataId).values,p=u.tensorMap.get(a.dataId).values,m=n.dtype==="string"?d.backend_util.fromUint8ToStringArray(h):h,f=n.dtype==="string"?d.backend_util.fromUint8ToStringArray(p):p,[g,x]=t(n.shape,a.shape,m,f,l);return u.makeTensorInfo(x,l,g)}const c=new ke(s,n.shape,a.shape);return u.runWebGPUProgram(c,[n,a],l)}}function To(s){const t=new Float32Array(s.length);for(let e=0;e<s.length;++e)t[e]=Math.abs(s[e]);return t}function K(s){return(t,e,i,o,r)=>{const n=d.backend_util.assertAndGetBroadcastShape(t,e),a=n.length,u=d.util.computeStrides(n),l=d.util.sizeFromShape(n),c=d.util.getTypedArrayFromDType(r,l),h=t.length,p=e.length,m=d.util.computeStrides(t),f=d.util.computeStrides(e),g=d.backend_util.getBroadcastDims(t,n),x=d.backend_util.getBroadcastDims(e,n);if(g.length+x.length===0)for(let C=0;C<c.length;++C)c[C]=s(i[C%i.length],o[C%o.length]);else for(let C=0;C<c.length;++C){const b=d.util.indexToLoc(C,a,u),w=b.slice(-h);g.forEach(D=>w[D]=0);const I=d.util.locToIndex(w,h,m),k=b.slice(-p);x.forEach(D=>k[D]=0);const $=d.util.locToIndex(k,p,f);c[C]=s(i[I],o[$])}return[c,n]}}function Bo(s,t,e,i){if(i==="int32"){const o=Int32Array.from(s);return[t,"int32",o]}if(i==="bool"){const o=d.util.toTypedArray([0],e),[r,n]=K((a,u)=>a!==u?1:0)(t,[],s,o,"bool");return[n,"bool",r]}throw new Error(`Error in Cast: failed to cast ${e} to ${i}`)}const Wo=K(((s,t)=>s+t));function ae(s){return(t,e,i)=>{const o=d.util.getArrayFromDType(e,t.length);for(let r=0;r<t.length;++r)o[r]=s(t[r],i);return o}}const Mo=ae(s=>Math.ceil(s));function Vo(s,t,e,i){const o=d.util.getArrayFromDType(e,d.util.sizeFromShape(t));if(i&&e!=="string"){let r=0;s.forEach(n=>{const a=d.util.sizeFromShape(n.shape);o.set(n.vals,r),r+=a})}else{let r=0;s.forEach(n=>{const a=e==="string"?d.backend_util.fromUint8ToStringArray(n.vals):n.vals;let u=0;for(let l=0;l<n.shape[0];++l){const c=l*t[1]+r;for(let h=0;h<n.shape[1];++h)o[c+h]=a[u++]}r+=n.shape[1]})}return o}const Uo=K((s,t)=>s===t?1:0);const Oo=ae(s=>Math.exp(s));const Go=ae(s=>Math.expm1(s));const Ho=ae(s=>Math.floor(s));const Xo=K((s,t)=>Math.floor(s/t));function Ko(s,t,e,i,o,r,n,a,u){const l=d.buffer([i,r],e);for(let c=0;c<i;c++){const h=[];let p=0;for(let m=0;m<o;m++){const f=s[c*o+m];p+=f*n[m],h.push(f)}if(p<0||p>=u/r)throw new Error(`Invalid indices: ${h} does not index into ${a}`);for(let m=0;m<r;m++)l.values[c*r+m]=t.get(...t.indexToLoc(p*r+m))}return l}function qo(s,t,e){const i=d.buffer(e,s.dtype);for(let o=0;o<i.size;++o){const n=i.indexToLoc(o).slice(),a=n[0],u=n[2],l=t.locToIndex([a,u]);n[2]=t.values[l];const c=s.locToIndex(n);0<=c&&c<s.values.length&&(i.values[o]=s.values[c])}return i}const Yo=K((s,t)=>s>t?1:0);const jo=K((s,t)=>s>=t?1:0);const Qo=K((s,t)=>s<t?1:0);const Zo=K((s,t)=>s<=t?1:0);const Jo=ae(s=>Math.log(s));function ei(s,t,e,i){const o=d.util.getTypedArrayFromDType(i,d.util.sizeFromShape(e));for(let r=0;r<o.length;++r){const n=r*t;let a=s[n];for(let u=0;u<t;++u){const l=s[n+u];(Number.isNaN(l)||l>a)&&(a=l)}o[r]=a}return o}const ti=K(((s,t)=>Math.max(s,t)));const si=K(((s,t)=>Math.min(s,t)));const et=K(((s,t)=>s*t));function oi(s,t,e){const i=d.util.createScalarValue(-1,e);return et([],t,i,s,e)}const ii=K(((s,t)=>s!==t?1:0));function ri(s,t,e,i,o){const r=t.length,n=d.util.sizeFromShape(t),a=d.util.computeStrides(t),u=d.util.computeStrides(o),l=d.util.getTypedArrayFromDType(e,d.util.sizeFromShape(o));for(let c=0;c<n;++c){const h=d.util.indexToLoc(c,r,a),p=new Array(h.length);for(let f=0;f<p.length;f++)p[f]=h[i[f]];const m=d.util.locToIndex(p,r,u);l[m]=s[c]}return l}function ni(s,t,e,i){const[o,r]=d.backend_util.computeOutAndReduceShapes(s,i),n=d.upcastType(t,"int32"),a=d.util.makeZerosTypedArray(d.util.sizeFromShape(o),n),u=d.util.sizeFromShape(r);for(let l=0;l<a.length;++l){const c=l*u;let h=1;for(let p=0;p<u;++p)h*=e[c+p];a[l]=h}return{outVals:a,outShape:o,outDtype:n}}function ai(s,t,e,i){const o=s===t,r=s<t&&e<0,n=t<s&&e>1;if(o||r||n)return d.util.makeZerosTypedArray(0,i);const a=Math.abs(Math.ceil((t-s)/e)),u=d.util.makeZerosTypedArray(a,i);t<s&&e===1&&(e=-1),u[0]=s;for(let l=1;l<u.length;l++)u[l]=u[l-1]+e;return u}const ui=ae(s=>1/Math.sqrt(s));function di(s,t,e,i,o,r,n,a,u,l){const c=[i/o,o],h=s.values,p=t.values;if(i===0)return d.buffer(e,t.dtype);const m=u instanceof d.TensorBuffer?u:d.buffer(c,t.dtype);typeof u=="string"||typeof u=="number"?m.values.fill(u):typeof u=="boolean"&&m.values.fill(+u);for(let f=0;f<r;f++){const g=[];let x=0;for(let C=0;C<n;C++){const b=h[f*n+C];g.push(b),x+=b*a[C]}if(x<0||x>=i/o)throw new Error(`Invalid indices: ${g} does not index into ${e}`);for(let C=0;C<o;C++)m.values[x*o+C]=t.rank===0?p[0]:p[f*o+C]}return m}function li(s,t,e,i,o){const r=d.slice_util.isSliceContinous(i,t,e),n=d.util.sizeFromShape(e),a=d.util.computeStrides(i);if(r){const h=d.slice_util.computeFlatOffset(t,a);return o==="string"?s.slice(h,h+n):s.subarray(h,h+n)}const u=o==="string"?d.backend_util.fromUint8ToStringArray(s):s,l=d.buffer(i,o,u),c=d.buffer(e,o);for(let h=0;h<c.size;++h){const p=c.indexToLoc(h),m=p.map((f,g)=>f+t[g]);c.set(l.get(...m),...p)}return o==="string"?d.backend_util.fromStringArrayToUint8(c.values):c.values}function ci(s,t,e,i){const o=d.buffer(s,t.dtype);for(let r=0;r<o.size;r++){const n=o.indexToLoc(r),a=new Array(n.length);for(let u=0;u<a.length;u++)a[u]=n[u]*e[u]+i[u];o.set(t.get(...a),...n)}return o}class hi{constructor(t,e,i,o,r,n){this.separator=d.util.encodeString(t),this.nGramWidths=e,this.leftPad=d.util.encodeString(i),this.rightPad=d.util.encodeString(o),this.padWidth=r,this.preserveShort=n}getPadWidth(t){return Math.min(this.padWidth<0?t-1:this.padWidth,t-1)}getNumNGrams(t,e){const i=this.getPadWidth(e);return Math.max(0,t+2*i-e+1)}createNGrams(t,e,i,o,r,n){for(let a=0;a<r;++a){const u=this.getPadWidth(n),l=Math.max(0,u-a),c=Math.max(0,u-(r-(a+1))),h=n-(l+c),p=e+(l>0?0:a-u);let m=0;m+=l*this.leftPad.length;for(let b=0;b<h;++b)m+=t[p+b].length;m+=c*this.rightPad.length;const f=l+c+h-1;m+=f*this.separator.length,i[o+a]=new Uint8Array(m);const g=i[o+a];let x=0;const C=b=>b.forEach(w=>g[x++]=w);for(let b=0;b<l;++b)C(this.leftPad),C(this.separator);for(let b=0;b<h-1;++b)C(t[p+b]),C(this.separator);if(h>0){C(t[p+h-1]);for(let b=0;b<c;++b)C(this.separator),C(this.rightPad)}else{for(let b=0;b<c-1;++b)C(this.rightPad),C(this.separator);C(this.rightPad)}}}compute(t,e){const i=t.length,o=e.length;if(o>0){let u=e[0];if(u!==0)throw new Error(`First split value must be 0, got ${u}`);for(let l=1;l<o;++l){let c=e[l]>=u;if(c=c&&e[l]<=i,!c)throw new Error(`Invalid split value ${e[l]}, must be in [${u}, ${i}]`);u=e[l]}if(u!==i)throw new Error(`Last split value must be data size. Expected ${i}, got ${u}`)}const r=o-1,n=d.util.getArrayFromDType("int32",o);if(i===0||o===0){const u=new Array(i);for(let l=0;l<=r;++l)n[l]=0;return[u,n]}n[0]=0;for(let u=1;u<=r;++u){const l=e[u]-e[u-1];let c=0;this.nGramWidths.forEach(h=>{c+=this.getNumNGrams(l,h)}),this.preserveShort&&l>0&&c===0&&(c=1),n[u]=n[u-1]+c}const a=new Array(n[r]);for(let u=0;u<r;++u){const l=e[u];let c=n[u];if(this.nGramWidths.forEach(h=>{const p=e[u+1]-e[u],m=this.getNumNGrams(p,h);this.createNGrams(t,l,a,c,m,h),c+=m}),this.preserveShort&&c===n[u]){const h=e[u+1]-e[u];if(h===0)continue;const p=h+2*this.padWidth;this.createNGrams(t,l,a,c,1,p)}}return[a,n]}}function pi(s,t,e,i,o,r,n,a){return new hi(e,i,o,r,n,a).compute(s,t)}const mi=K(((s,t)=>s-t));function fi(s,t){const e=new Array(s.rank);for(let o=0;o<e.length;o++)e[o]=s.shape[o]*t[o];const i=d.buffer(e,s.dtype);for(let o=0;o<i.values.length;++o){const r=i.indexToLoc(o),n=new Array(s.rank);for(let u=0;u<n.length;u++)n[u]=r[u]%s.shape[u];const a=s.locToIndex(n);i.values[o]=s.values[a]}return i}const he=(s,t)=>{const e=t.value-s.value;return e===0?s.index-t.index:e};function tt(s,t,e=0,i=s.length-1){for(;i>e;){if(i-e>600){const a=i-e+1,u=t-e+1,l=Math.log(a),c=.5*Math.exp(2*l/3),h=.5*Math.sqrt(l*c*(a-c)/a)*Math.sign(u-a/2),p=Math.max(e,Math.floor(t-u*c/a+h)),m=Math.min(i,Math.floor(t+(a-u)*c/a+h));tt(s,t,p,m)}const o=s[t];let r=e,n=i;for(d.util.swap(s,e,t),he(s[i],o)>0&&d.util.swap(s,e,i);r<n;){for(d.util.swap(s,r,n),r++,n--;he(s[r],o)<0;)r=r+1;for(;he(s[n],o)>0;)n=n-1}he(s[e],o)===0?d.util.swap(s,e,n):(n=n+1,d.util.swap(s,n,i)),n<=t&&(e=n+1),t<=n&&(i=n-1)}}function gi(s,t,e,i,o){const r=t[t.length-1],[n,a]=[s.length/r,r],u=d.util.getTypedArrayFromDType(e,n*i),l=d.util.getTypedArrayFromDType("int32",n*i);for(let h=0;h<n;h++){const p=h*a,m=s.subarray(p,p+a);let f=new Array(m.length);m.forEach((b,w)=>f[w]={value:b,index:w}),i<f.length&&(tt(f,i),f=f.slice(0,i)),o&&f.sort(he);const g=h*i,x=u.subarray(g,g+i),C=l.subarray(g,g+i);for(let b=0;b<i;b++)x[b]=f[b].value,C[b]=f[b].index}const c=t.slice();return c[c.length-1]=i,[d.buffer(c,e,u),d.buffer(c,"int32",l)]}const xi=Object.freeze(Object.defineProperty({__proto__:null,addImpl:Wo,castImpl:Bo,ceilImpl:Mo,concatImpl:Vo,equalImpl:Uo,expImpl:Oo,expm1Impl:Go,floorDivImpl:Xo,floorImpl:Ho,gatherNdImpl:Ko,gatherV2Impl:qo,greaterEqualImpl:jo,greaterImpl:Yo,lessEqualImpl:Zo,lessImpl:Qo,logImpl:Jo,maxImpl:ei,maximumImpl:ti,minimumImpl:si,multiplyImpl:et,negImpl:oi,notEqualImpl:ii,prodImpl:ni,rangeImpl:ai,rsqrtImpl:ui,scatterImpl:di,simpleAbsImpl:To,sliceImpl:li,stridedSliceImpl:ci,stringNGramsImpl:pi,subImpl:mi,tileImpl:fi,topKImpl:gi,transposeImpl:ri},Symbol.toStringTag,{value:"Module"}));const{addImpl:Ci,castImpl:bi,ceilImpl:wi,concatImpl:Si,equalImpl:yi,expImpl:vi,expm1Impl:Ii,floorImpl:ki,floorDivImpl:Ri,gatherNdImpl:Pi,gatherV2Impl:$i,greaterEqualImpl:Di,greaterImpl:Ni,lessEqualImpl:zi,lessImpl:Ai,logImpl:Fi,maxImpl:_i,maximumImpl:Li,minimumImpl:Ei,multiplyImpl:Ti,negImpl:Bi,notEqualImpl:Wi,prodImpl:Mi,rangeImpl:Vi,rsqrtImpl:Ui,scatterImpl:Oi,simpleAbsImpl:Gi,sliceImpl:Hi,stridedSliceImpl:Xi,stringNGramsImpl:Ki,subImpl:qi,tileImpl:Yi,topKImpl:ji,transposeImpl:Qi}=xi;const Zi=_({opType:S.ABS,cpuKernelImpl:Gi}),Ji={kernelName:d.Abs,backendName:"webgpu",kernelFunc:Zi};const er=_({opType:S.ACOS}),tr={kernelName:d.Acos,backendName:"webgpu",kernelFunc:er};const sr=_({opType:S.ACOSH}),or={kernelName:d.Acosh,backendName:"webgpu",kernelFunc:sr};const ir=W({opType:N.ADD,cpuKernelImpl:Ci,supportsComplex:!0}),rr={kernelName:d.Add,backendName:"webgpu",kernelFunc:ir};class nr{constructor(t){this.workPerThread=1,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t[0],this.variableNames=t.map((e,i)=>`T${i}`),this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,[this.workPerThread,1,1]),this.shaderKey="addN"}getUserCode(){const t=[];this.variableNames.forEach(o=>{t.push(`let v${o} = get${o}ByOutputCoords(coords);`)});const e=this.variableNames.map(o=>`v${o}`).join(" + ");return`
      ${y("index")} {
        for (var i = 0; i < ${this.workPerThread}; i = i + 1) {
          let flatIndex = index * ${this.workPerThread} + i;
          if (flatIndex < uniforms.size) {
            let coords = getCoordsFromIndex(flatIndex);
            ${t.join(`
        `)}
            setOutputAtIndex(flatIndex, ${e});
          }
        }
      }
    `}}function ar(s){const{inputs:t,backend:e}=s,i=t;if(i.length===1)return H({inputs:{x:i[0]},backend:e});const o=i.map(a=>a.dtype).reduce((a,u)=>d.upcastType(a,u)),r=i.map(a=>a.shape),n=new nr(r);return e.runWebGPUProgram(n,i,o)}const ur={kernelName:d.AddN,backendName:"webgpu",kernelFunc:ar};class dr{constructor(t,e){this.variableNames=["A"],this.workgroupSize=[16,16,1];const i=new Array(t.length);for(let o=0;o<i.length;o++)i[o]=t[e[o]];this.outputShape=i,this.dispatchLayout={x:[0],y:[1]},this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,[1,1,1]),this.shaderKey="transposeShared"}getUserCode(){d.util.assert(this.workgroupSize[0]===this.workgroupSize[1],()=>`Must be a square tile, current tile shape is ${this.workgroupSize[0]} x ${this.workgroupSize[1]}`);const t=this.workgroupSize[0];return`
      var<workgroup> tile : array<array<f32, ${this.workgroupSize[0]+1}>, ${this.workgroupSize[0]}>;
      ${y()} {
        var x = i32(workgroupId.x) * ${t} + i32(localId.x);
        var y = i32(workgroupId.y) * ${t} + i32(localId.y);
        let width = uniforms.outShape[0];
        let height = uniforms.outShape[1];
        if (x < width && y < height) {
          tile[localId.y][localId.x] = f32(A[y * width + x]);
        }
        workgroupBarrier();

        x = i32(workgroupId.y) * ${t} + i32(localId.x);
        y = i32(workgroupId.x) * ${t} + i32(localId.y);
        if (x < height && y < width) {
          setOutputAtIndex((y * height + x), tile[localId.x]
            [localId.y]);
        }
      }
    `}}class lr{constructor(t,e){this.variableNames=["A"],this.workPerThread=1,this.workgroupSize=[64,1,1],this.size=!0;const i=new Array(t.length);for(let o=0;o<i.length;o++)i[o]=t[e[o]];this.outputShape=i,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,[this.workPerThread,1,1]),this.newDim=e,this.shaderKey=`transpose_${e}`}getUserCode(){const t=L(this.outputShape.length),e=st(this.newDim);return`
      ${y("index")} {
        for(var i = 0; i < ${this.workPerThread}; i = i + 1) {
          let flatIndex = index * ${this.workPerThread} + i;
          if(flatIndex < uniforms.size) {
            let coords = getCoordsFromIndex(flatIndex);
            setOutputAtIndex(flatIndex, A[getIndexFromCoords${this.outputShape.length}D(
              ${t}(${e}), uniforms.aShape)]);
          }
        }
      }
    `}}function st(s){const t=s.length;if(t>6)throw Error(`Transpose for rank ${t} is not yet supported`);const e=new Array(t);for(let i=0;i<s.length;i++)e[s[i]]=`coords.${j(i)}`;return e.join()}function Y(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{perm:r}=i,n=e,a=o.shape.length,u=new Array(a);for(let c=0;c<u.length;c++)u[c]=o.shape[r[c]];if(e.shouldExecuteOnCPU([o])){const h=n.tensorMap.get(o.dataId).values,p=Qi(h,o.shape,o.dtype,r,u);return e.makeTensorInfo(u,o.dtype,p)}if(o.shape.length===2&&d.util.arraysEqual(r,[1,0])){const c=new dr(o.shape,r);return n.runWebGPUProgram(c,[o],o.dtype)}const l=new lr(o.shape,r);return n.runWebGPUProgram(l,[o],o.dtype)}const cr={kernelName:d.Transpose,backendName:"webgpu",kernelFunc:Y};class hr{constructor(t,e,i){this.variableNames=["x"],this.uniforms="reduceSize : i32,",this.size=!0,this.inputShape=[t.batchSize,t.inSize];const[o]=d.backend_util.computeOutAndReduceShapes(this.inputShape,[1]);this.outputShape=o.length===0?[1]:o,t.inSize>=32768&&i>=512?this.workgroupSize=[512,1,1]:t.inSize>=4096?this.workgroupSize=[256,1,1]:this.workgroupSize=[64,1,1],this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,[1,1,1]),this.reduceType=e,this.shaderKey=`reduce_${e}`}getUserCode(){let t="",e="0.0";const i=this.workgroupSize[0];this.reduceType==="min"||this.reduceType==="max"?(t=`
         if (isnan(candidate)) {
          bestValue = uniforms.NAN;
         } else if (!isnan(bestValue) && candidate ${this.reduceType==="min"?"<":">"} bestValue)
           {  bestValue = candidate; }`,e="f32(x[offset])"):this.reduceType==="sum"||this.reduceType==="mean"?t=" bestValue = bestValue + candidate; ":this.reduceType==="prod"?(t=" bestValue = bestValue * candidate; ",e="1.0"):this.reduceType==="all"?(t=" bestValue = f32(bestValue >= 1.0 && candidate >= 1.0); ",e="1.0"):this.reduceType==="any"&&(t=" bestValue = f32(bestValue >= 1.0 || candidate >= 1.0); ",e="0.0");const o=this.reduceType==="mean"?"setOutputAtIndex(outputIndex, bestValue / f32(uniforms.reduceSize));":"setOutputAtIndex(outputIndex, bestValue);";return`
       fn DIV_CEIL(a : u32, b : u32) -> u32 {
        return ((a - 1u) / b + 1u);
       }

       ${`
         var<workgroup> xBestValues : array<f32, ${i}>;
       `}
       fn getOffset(outputIndex : i32) -> i32 {
         let outputCoords = getCoordsFromIndex(outputIndex);
         let offset = ${this.outputShape.length===1?"outputCoords":"outputCoords[0]"} * uniforms.reduceSize;
          return offset;
       }
       ${y("index")} {
         let outputIndex = index / ${i};
         let offset = getOffset(outputIndex);
         var bestValue = ${e};
         let Length = uniforms.reduceSize;
         let WorkPerThread = DIV_CEIL(u32(Length), ${i}u);
         for (var k = i32(localId.x); k < Length && outputIndex < uniforms.size;
             k = k + ${i}) {
           let candidate = f32(x[offset + k]);
           ${t}
         }
         xBestValues[localId.x] = bestValue;
         workgroupBarrier();

         var reduceSize = min(u32(Length), ${i}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (localId.x < currentSize) {
            let candidate = xBestValues[localId.x + interval];
            ${t}
            xBestValues[localId.x] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (localId.x == 0u && outputIndex < uniforms.size) {
          ${o}
        }
       }
     `}}const pr={mean:"float32",all:"bool",any:"bool"};function ie(s,t,e,i,o){const r=s.shape.length,n=[],a=d.util.parseAxisParam(t,s.shape);let u=a;const l=d.backend_util.getAxesPermutation(u,r);let c=s;l!=null&&(c=Y({inputs:{x:s},attrs:{perm:l},backend:o}),u=d.backend_util.getInnerMostAxes(u.length,r),n.push(c)),d.backend_util.assertAxesAreInnerMostDims(i,u,r);const[h,p]=d.backend_util.computeOutAndReduceShapes(c.shape,u);let m=h;e&&(m=d.backend_util.expandShapeToKeepDim(h,a));let f;if((i==="max"||i==="prod")&&o.shouldExecuteOnCPU([c])){const g=o.tensorMap.get(c.dataId).values;switch(i){case"max":const x=_i(g,d.util.sizeFromShape(p),m,s.dtype);f=o.makeTensorInfo(m,s.dtype,x);break;case"prod":const{outVals:C,outShape:b,outDtype:w}=Mi(c.shape,c.dtype,g,u);f=o.makeTensorInfo(b,w,C);break;default:throw new Error(`${i} CPU implementation is not yet supported.`)}}else{const g=d.util.sizeFromShape(p),C=d.util.sizeFromShape(c.shape)/g,b={windowSize:g,inSize:g,batchSize:C,outSize:1},w=pr[i]||d.sumOutType(s.dtype),I=[{type:"int32",data:[g]}],k=new hr(b,i,o.device.limits.maxComputeWorkgroupSizeX),$=o.runWebGPUProgram(k,[c],w,I);n.push($),f=P({inputs:{x:$},attrs:{shape:m},backend:o})}return n.forEach(g=>o.disposeData(g.dataId)),f}function mr(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{keepDims:r,axis:n}=i;return ie(o,n,r,"all",e)}const fr={kernelName:d.All,backendName:"webgpu",kernelFunc:mr};function gr(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{keepDims:r,axis:n}=i;return ie(o,n,r,"any",e)}const xr={kernelName:d.Any,backendName:"webgpu",kernelFunc:gr};class ot{constructor(t,e,i){this.workgroupSize=[64,1,1],this.variableNames=["x"],this.uniforms="infinityValue : f32,",this.size=!0;const o=[e];this.op=i==="min"?"<":">";const[r,n]=d.backend_util.computeOutAndReduceShapes(t,o);this.outputShape=r.length===0?[1]:r,this.dispatchLayout=R(this.outputShape),d.util.sizeFromShape(n)<32?(this.type="plain",this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize)):(this.type="shared",this.dispatch=v(this.dispatchLayout,this.outputShape,[1,1,1])),this.inputShape=t,this.shaderKey=`argMinMax_${this.op}_${this.type}`}getUserCode(){const t=this.workgroupSize[0],e=()=>this.inputShape.length===1?"uniforms.xShape":`uniforms.xShape.${j(this.inputShape.length-1)}`,i=()=>{let o="";if(this.outputShape.length===1)this.inputShape.length!==1&&(o+="outputCoords,");else for(let r=0;r<this.outputShape.length;r++)o+=`outputCoords.${j(r)},`;return o};return this.type==="shared"?`
      fn DIV_CEIL(a : u32, b : u32) -> u32 {
        return ((a - 1u) / b + 1u);
      }

      ${`
      var<workgroup> xBestIndices : array<i32, ${t}>;
      var<workgroup> xBestValues : array<f32, ${t}>;
    `}

      ${y("index")} {
        let outputIndex = index / ${t};
        let reduceLength = ${e()};

        var bestIndex = i32(localId.x);
        var bestValue = uniforms.infinityValue;
        let outputCoords = getCoordsFromIndex(outputIndex);
        for (var k = i32(localId.x); k < reduceLength && outputIndex < uniforms.size;
            k = k + ${t}) {
          let candidate = getX(${i()} k);
          if (!isnan(candidate) && candidate ${this.op} bestValue) {
            bestValue = candidate;
            bestIndex = k;
          }
        }
        xBestValues[localId.x] = bestValue;
        xBestIndices[localId.x] = bestIndex;
        workgroupBarrier();

        var reduceSize = min(u32(reduceLength), ${t}u);
        for (var currentSize = reduceSize / 2u; reduceSize > 1u;
            currentSize = reduceSize / 2u) {
          let interval = DIV_CEIL(reduceSize, 2u);
          if (localId.x < currentSize) {
            let candidate = xBestValues[localId.x + interval];
            if (candidate ${this.op} bestValue) {
              bestValue = candidate;
              xBestValues[localId.x] = bestValue;
              xBestIndices[localId.x] = xBestIndices[localId.x + interval];
            }
          }
          reduceSize = interval;
          workgroupBarrier();
        }

        if (localId.x == 0u && outputIndex < uniforms.size) {
          setOutputAtIndexI32(outputIndex, xBestIndices[localId.x]);
        }
      }
    `:`
      ${y("index")} {
        if (index < uniforms.size) {
          let outputCoords = getCoordsFromIndex(index);
          var bestIndex = 0;
          var bestValue = getX(${i()} 0);
          let reduceLength = ${e()};
          for (var i = 1; i < reduceLength; i++) {
            let candidate = getX(${i()} i);
            if (candidate ${this.op} bestValue) {
              bestValue = candidate;
              bestIndex = i;
            }
          }
          setOutputAtIndexI32(index, bestIndex);
        }
      }
      `}}function Cr(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{axis:r}=i;let n=d.util.parseAxisParam(r,o.shape);const a=d.backend_util.getAxesPermutation(n,o.shape.length);let u=o;const l=[];a!=null&&(u=Y({inputs:{x:o},backend:e,attrs:{perm:a}}),l.push(u),n=d.backend_util.getInnerMostAxes(n.length,u.shape.length)),d.backend_util.assertAxesAreInnerMostDims("argMax",[n[0]],u.shape.length);const c=new ot(u.shape,n[0],"max"),h=[{type:"float32",data:[Number.NEGATIVE_INFINITY]}],p=e.runWebGPUProgram(c,[u],"int32",h);return l.forEach(m=>e.disposeData(m.dataId)),p}const br={kernelName:d.ArgMax,backendName:"webgpu",kernelFunc:Cr};function wr(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{axis:r}=i;let n=d.util.parseAxisParam(r,o.shape);const a=d.backend_util.getAxesPermutation(n,o.shape.length);let u=o;const l=[];a!=null&&(u=Y({inputs:{x:o},backend:e,attrs:{perm:a}}),l.push(u),n=d.backend_util.getInnerMostAxes(n.length,u.shape.length)),d.backend_util.assertAxesAreInnerMostDims("argMin",[n[0]],u.shape.length);const c=new ot(u.shape,n[0],"min"),h=[{type:"float32",data:[Number.POSITIVE_INFINITY]}],p=e.runWebGPUProgram(c,[u],"int32",h);return l.forEach(m=>e.disposeData(m.dataId)),p}const Sr={kernelName:d.ArgMin,backendName:"webgpu",kernelFunc:wr};const yr=_({opType:S.ASIN}),vr={kernelName:d.Asin,backendName:"webgpu",kernelFunc:yr};const Ir=_({opType:S.ASINH}),kr={kernelName:d.Asinh,backendName:"webgpu",kernelFunc:Ir};const Rr=_({opType:S.ATAN}),Pr={kernelName:d.Atan,backendName:"webgpu",kernelFunc:Rr};const $r=W({opType:N.ATAN2}),Dr={kernelName:d.Atan2,backendName:"webgpu",kernelFunc:$r};const Nr=_({opType:S.ATANH}),zr={kernelName:d.Atanh,backendName:"webgpu",kernelFunc:Nr};class Ar{constructor(t){this.variableNames=["x"],this.uniforms="strides : vec2<i32>,",this.workgroupSize=[256,1,1],this.size=!0,this.outputShape=t.outShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="poolWithFilterSizeEqualsOne"}getUserCode(){return`
      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getCoordsFromIndex(index);
          let batch = coords[0];
          let d = coords[3];

          let xRCCorner = coords.yz * uniforms.strides;
          let xRCorner = xRCCorner.x;
          let xCCorner = xRCCorner.y;

          let value = getX(batch, xRCorner, xCCorner, d);
          setOutputAtIndex(index, value);
        }
      }
    `}}class pe{constructor(t,e,i=!1,o=!1,r=!1){if(this.variableNames=["x"],this.uniforms="strides : vec2<i32>, pads : vec2<i32>, dilations : vec2<i32>, convDims : vec2<i32>, filterDims : vec2<i32>,",this.workgroupSize=[128,1,1],this.size=!0,e==="avg"&&i)throw new Error("Cannot compute positions for average pool.");this.outputShape=t.outShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.poolType=e,this.computePositions=i,this.flattenPositions=o,this.includeBatchIndex=r,this.shaderKey=`pool2D_${e}_${i}_${o}_${r}`}getUserCode(){let t;this.poolType==="avg"?t="resultValue = resultValue + value; count = count + 1.0;":this.computePositions?t=`let currMaxValue = mix(value, maxValue, maxValueFound);
      if (value >= currMaxValue) {
        maxValue = value;
        maxValueFound = 1.0;
        maxPosition = ${this.flattenPositions?this.includeBatchIndex?"((batch * uniforms.xShape[1] + xR) * uniforms.xShape[2] + xC) * uniforms.xShape[3] + d":"(xR * uniforms.xShape[2] + xC) * uniforms.xShape[3] + d":"wR * uniforms.filterDims.y + wC"};
      }`:t="resultValue = max(value, resultValue);";let e="resultValue";return this.poolType==="avg"&&(e="resultValue / max(count, 1.0)"),`
      ${y("index")} {
      if (index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
          let batch = coords[0];
          let d = coords[3];
          let xRCCorner = vec2<i32>(coords.yz) * uniforms.strides - uniforms.pads;
          let xRCorner = xRCCorner.x;
          let xCCorner = xRCCorner.y;

          ${this.computePositions?`var maxValue = 0.0;
            var maxValueFound = 0.0;
            var maxPosition = 0;`:`var resultValue = ${this.poolType==="avg"?"0.0":"-1.0 / pow(10.0, -20.0)"};`}

          var count = 0.0;
          for (var wR = 0; wR < uniforms.filterDims.x; wR = wR + uniforms.dilations.x) {
            let xR = xRCorner + wR;

            if (xR < 0 || xR >= uniforms.convDims.x) {
              continue;
            }

            for (var wC = 0; wC < uniforms.filterDims.y; wC = wC + uniforms.dilations.y) {
              let xC = xCCorner + wC;
              if (xC < 0 || xC >= uniforms.convDims.y) {
                continue;
              }

              let value = getX(batch, xR, xC, d);
              ${t}
            }
          }

          ${this.computePositions?"setOutputAtIndexI32(index, maxPosition);":`setOutputAtIndex(index, ${e});`}
        }
      }
    `}}class Te{constructor(t,e,i=!1,o=!1,r=!1){if(this.variableNames=["x"],this.uniforms="strides : vec3<i32>, pads : vec3<i32>, convDims : vec3<i32>, filterDims : vec3<i32>,",this.workgroupSize=[128,1,1],this.size=!0,e==="avg"&&i)throw new Error("Cannot compute positions for average pool.");this.outputShape=t.outShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.poolType=e,this.computePositions=i,this.flattenPositions=o,this.includeBatchIndex=r,this.shaderKey=`pool3D_${e}_${i}_${o}_${r}`}getUserCode(){let t;this.poolType==="avg"?t="resultValue += value; count += 1.0;":this.computePositions?t=`let currMaxValue = mix(value, maxValue, maxValueFound);
      if (value >= currMaxValue) {
        maxValue = value;
        maxValueFound = 1.0;
        maxPosition = ${this.flattenPositions?this.includeBatchIndex?"(((batch * uniforms.xShape.y + xD) * uniforms.xShape.z + xR) * uniforms.xShape.w + xC) * uniforms.xShape.u + ch":"((xD * uniforms.xShape.z + xR) * uniforms.xShape.w + xC) * uniforms.xShape.u + ch":"wD * uniforms.filterDims.y * uniforms.filterDims.y + wR * uniforms.filterDims.z + wC"};
      }`:t="resultValue = max(value, resultValue);";let e="resultValue";return this.poolType==="avg"&&(e="resultValue / max(count, 1.0)"),`
      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getCoordsFromIndex(index);
          let batch = coords.x;
          let ch = coords.u;

          let xCorner = vec3<i32>(coords.y, coords.z, coords.w) * uniforms.strides - uniforms.pads;
          let xDCorner = xCorner.x;
          let xRCorner = xCorner.y;
          let xCCorner = xCorner.z;

          ${this.computePositions?`var maxValue = 0.0;
            var maxValueFound = 0.0;
            var maxPosition = 0;`:`var resultValue = ${this.poolType==="avg"?"0.0":"-1.0 / pow(10.0, -20.0)"};`}

          var count = 0.0;
          for (var wD = 0; wD < uniforms.filterDims.x; wD++) {
            let xD = xDCorner + wD;
            if (xD < 0 || xD >= uniforms.convDims.x) {
              continue;
            }

            for (var wR = 0; wR < uniforms.filterDims.y; wR++) {
              let xR = xRCorner + wR;
              if (xR < 0 || xR >= uniforms.convDims.y) {
                continue;
              }

              for (var wC = 0; wC < uniforms.filterDims.z; wC++) {
                let xC = xCCorner + wC;
                if (xC < 0 || xC >= uniforms.convDims.z) {
                  continue;
                }

                let value = getX(batch, xD, xR, xC, ch);
                ${t}
              }
            }
          }

          ${this.computePositions?"setOutputAtIndexI32(index, maxPosition);":`setOutputAtIndex(index, ${e});`}
        }
      }
    `}}function it(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{reductionIndices:r,keepDims:n}=i;return ie(o,r,n,"max",e)}const Fr={kernelName:d.Max,backendName:"webgpu",kernelFunc:it};function rt(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{keepDims:r,axis:n}=i;return ie(o,n,r,"mean",e)}const _r={kernelName:d.Mean,backendName:"webgpu",kernelFunc:rt};function nt(s,t,e,i){if(t.filterWidth===1&&t.filterHeight===1&&d.util.arraysEqual(t.inShape,t.outShape))return H({inputs:{x:s},backend:i});if(t.filterWidth===t.inWidth&&t.filterHeight===t.inHeight&&t.batchSize===1&&t.padInfo.type==="VALID"){const n=s.shape.length,a=P({inputs:{x:s},backend:i,attrs:{shape:[s.shape[n-3]*s.shape[n-2],s.shape[n-1]]}});let u;e==="avg"?u=rt({inputs:{x:a},backend:i,attrs:{axis:0,keepDims:!1}}):(d.util.assert(e==="max",()=>`Invalid pool type ${e}`),u=it({inputs:{x:a},backend:i,attrs:{reductionIndices:0,keepDims:!1}}));const l=P({inputs:{x:u},backend:i,attrs:{shape:t.outShape}});return i.disposeData(a.dataId),i.disposeData(u.dataId),l}let o;const r=[{type:"int32",data:[t.strideHeight,t.strideWidth]}];return t.filterHeight===1&&t.filterWidth===1?o=new Ar(t):(e==="avg"?o=new pe(t,"avg"):(d.util.assert(e==="max",()=>`Invalid pool type ${e}`),o=new pe(t,"max")),r.push({type:"int32",data:[t.padInfo.top,t.padInfo.left]},{type:"int32",data:[t.dilationHeight,t.dilationWidth]},{type:"int32",data:[t.inHeight,t.inWidth]},{type:"int32",data:[t.effectiveFilterHeight,t.effectiveFilterWidth]})),i.runWebGPUProgram(o,[s],s.dtype,r)}function Lr(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{filterSize:r,strides:n,pad:a,dimRoundingMode:u}=i,c=d.backend_util.computePool2DInfo(o.shape,r,n,1,a,u);return nt(o,c,"avg",e)}const Er={kernelName:d.AvgPool,backendName:"webgpu",kernelFunc:Lr};function Tr(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{filterSize:r,strides:n,pad:a,dataFormat:u,dimRoundingMode:l}=i,c=[1,1,1],h=d.backend_util.computePool3DInfo(o.shape,r,n,c,a,l,u),p=new Te(h,"avg"),m=[{type:"int32",data:[h.strideDepth,h.strideHeight,h.strideWidth]},{type:"int32",data:[h.padInfo.front,h.padInfo.top,h.padInfo.left]},{type:"int32",data:[h.inDepth,h.inHeight,h.inWidth]},{type:"int32",data:[h.effectiveFilterDepth,h.effectiveFilterHeight,h.effectiveFilterWidth]}];return e.runWebGPUProgram(p,[o],o.dtype,m)}const Br={kernelName:d.AvgPool3D,backendName:"webgpu",kernelFunc:Tr};class Wr{constructor(t){this.variableNames=["dy"],this.uniforms=`strides : vec2<i32>, pads : vec2<i32>, dilations : vec2<i32>, filterDims : vec2<i32>,
       outHeight : i32, outWidth : i32, avgMultiplier : f32,`,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.inShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="avgPool2DBackprop"}getUserCode(){return`
      ${y("index")} {
      if (index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        let batch = coords[0];
        let d = coords[3];

        let dyRCCorner = vec2<i32>(coords.yz) - uniforms.pads;
        let dyRCorner = dyRCCorner.x;
        let dyCCorner = dyRCCorner.y;

        // Convolve dy(?, ?, d) with pos mask(:, :, d) to get dx(xR, xC, d).
        // ? = to be determined. : = across all values in that axis.
        var dotProd = 0.0;
        for (var wR = 0; wR < uniforms.filterDims[0]; wR = wR + uniforms.dilations[0]) {
          let dyR = f32(dyRCorner + wR) / f32(uniforms.strides[0]);

          if (dyR < 0.0 || dyR >= f32(uniforms.outHeight) || fract(dyR) > 0.0) {
            continue;
          }
          let idyR = i32(dyR);

          for (var wC = 0; wC < uniforms.filterDims[1]; wC = wC + uniforms.dilations[1]) {
            let dyC = f32(dyCCorner + wC) / f32(uniforms.strides[1]);

            if (dyC < 0.0 || dyC >= f32(uniforms.outWidth) || fract(dyC) > 0.0) {
              continue;
            }
            let idyC = i32(dyC);

            let dyValue = getDy(batch, idyR, idyC, d);

            dotProd = dotProd + dyValue * uniforms.avgMultiplier;
          }
        }
        setOutputAtIndex(index, dotProd);
      }
    }
    `}}class Mr{constructor(t){this.variableNames=["dy"],this.uniforms=`strides : vec3<i32>, pads : vec3<i32>, filterDims : vec3<i32>,
       outDepth : i32, outHeight : i32, outWidth : i32, avgMultiplier : f32,`,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.inShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="avgPool3DBackprop"}getUserCode(){return`
      ${y("index")} {
      if (index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        let batch = coords.x;
        let ch = coords.u;

        let dyCorner = vec3<i32>(coords.y, coords.z, coords.w) - uniforms.pads;
        let dyDCorner = dyCorner.x;
        let dyRCorner = dyCorner.y;
        let dyCCorner = dyCorner.z;

        // Convolve dy(?, ?, ?, d) with pos mask(:, :, :, ch) to get
        // dx(xD, xR, xC, ch).
        // ? = to be determined. : = across all values in that axis.
        var dotProd = 0.0;
        for (var wD = 0; wD < uniforms.filterDims[0]; wD++) {
          let dyD = f32(dyDCorner + wD) / f32(uniforms.strides[0]);

          if (dyD < 0.0 || dyD >= f32(uniforms.outDepth) || fract(dyD) > 0.0) {
            continue;
          }
          let idyD = i32(dyD);

          for (var wR = 0; wR < uniforms.filterDims[1]; wR++) {
            let dyR = f32(dyRCorner + wR) / f32(uniforms.strides[1]);

            if (dyR < 0.0 || dyR >= f32(uniforms.outHeight) || fract(dyR) > 0.0) {
              continue;
            }
            let idyR = i32(dyR);

            for (var wC = 0; wC < uniforms.filterDims[2]; wC++) {
              let dyC = f32(dyCCorner + wC) / f32(uniforms.strides[2]);

              if (dyC < 0.0 || dyC >= f32(uniforms.outWidth) || fract(dyC) > 0.0) {
                continue;
              }
              let idyC = i32(dyC);

              let dyValue = getDy(batch, idyD, idyR, idyC, ch);
              dotProd += dyValue * uniforms.avgMultiplier;
            }
          }
        }
        setOutputAtIndex(index, dotProd);
      }
    }
    `}}function Vr(s){const{inputs:t,backend:e,attrs:i}=s,{dy:o,input:r}=t,n=r,{filterSize:a,strides:u,pad:l,dimRoundingMode:c}=i,h=d.backend_util.computePool3DInfo(n.shape,a,u,1,l,c),p=new Mr(h),m=1/(h.filterDepth*h.filterHeight*h.filterWidth),f=[{type:"int32",data:[h.strideDepth,h.strideHeight,h.strideWidth]},{type:"int32",data:[h.effectiveFilterDepth-1-h.padInfo.front,h.effectiveFilterHeight-1-h.padInfo.top,h.effectiveFilterWidth-1-h.padInfo.left]},{type:"int32",data:[h.effectiveFilterDepth,h.effectiveFilterHeight,h.effectiveFilterWidth]},{type:"int32",data:[h.outDepth]},{type:"int32",data:[h.outHeight]},{type:"int32",data:[h.outWidth]},{type:"float32",data:[m]}];return e.runWebGPUProgram(p,[o],n.dtype,f)}const Ur={kernelName:d.AvgPool3DGrad,backendName:"webgpu",kernelFunc:Vr};function Or(s){const{inputs:t,backend:e,attrs:i}=s,{dy:o,input:r}=t,n=r;_e([o,r],"avgPoolGrad");const{filterSize:a,strides:u,pad:l}=i,c=d.backend_util.computePool2DInfo(n.shape,a,u,1,l),h=new Wr(c),p=1/(c.filterHeight*c.filterWidth),m=[{type:"int32",data:[c.strideHeight,c.strideWidth]},{type:"int32",data:[c.effectiveFilterHeight-1-c.padInfo.top,c.effectiveFilterWidth-1-c.padInfo.left]},{type:"int32",data:[c.dilationHeight,c.dilationWidth]},{type:"int32",data:[c.effectiveFilterHeight,c.effectiveFilterWidth]},{type:"int32",data:[c.outHeight]},{type:"int32",data:[c.outWidth]},{type:"float32",data:[p]}];return e.runWebGPUProgram(h,[o],n.dtype,m)}const Gr={kernelName:d.AvgPoolGrad,backendName:"webgpu",kernelFunc:Or};function Hr(s){const{inputs:t,backend:e,attrs:i}=s,{a:o,b:r}=t,{transposeA:n,transposeB:a}=i;return Ie({a:o,b:r,transposeA:n,transposeB:a,backend:e})}const Xr={kernelName:d.BatchMatMul,backendName:"webgpu",kernelFunc:Hr};class Kr{constructor(t,e){this.variableNames=["source"],this.workPerThread=1,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=e,this.rank=e.length,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,[this.workPerThread,1,1]),this.start=t,this.uniforms=`start : ${L(t.length)}, `,this.shaderKey="slice"}getUserCode(){const t=L(this.rank),e=qr(this.rank);let i;return this.start.length===1?i=this.outputShape.map((r,n)=>"sourceLoc = uniforms.start + coords;"):i=this.outputShape.map((r,n)=>`sourceLoc.${Be[n]} = uniforms.start.${j(n)} + coords.${Be[n]};`),`
      ${y("index")} {
        if (index < uniforms.size) {
          var sourceLoc : ${t};
          let coords = getCoordsFromIndex(index);
          ${i.join(`
`)}
          setOutputAtIndex(index, getSource(${e}));
        }
      }
    `}}const Be=["x","y","z","w","u","v"];function qr(s){if(s===1)return"sourceLoc";if(s<=6)return Be.slice(0,s).map(t=>`sourceLoc.${t}`).join(",");throw Error(`Slicing for rank ${s} is not yet supported`)}function ue(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{begin:r,size:n}=i,[a,u]=d.slice_util.parseSliceParams(o,r,n);if(d.slice_util.assertParamsValid(o,a,u),e.shouldExecuteOnCPU([o])||o.dtype==="string"){const h=e.tensorMap.get(o.dataId),p=Hi(h.values,a,u,o.shape,o.dtype);return e.makeTensorInfo(u,o.dtype,p)}if(d.util.sizeFromShape(u)===0)return e.makeTensorInfo(u,o.dtype,[]);const l=new Kr(a,u),c=[{type:"int32",data:a}];return e.runWebGPUProgram(l,[o],o.dtype,c)}const Yr={kernelName:d.Slice,backendName:"webgpu",kernelFunc:ue};const jr=s=>{const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{blockShape:r,crops:n}=i;d.util.assert(o.shape.length<=4,()=>"batchToSpaceND for rank > 4 with a WebGPU backend not implemented yet");const a=r.reduce((b,w)=>b*w),u=d.backend_util.getReshaped(o.shape,r,a),l=d.backend_util.getPermuted(u.length,r.length),c=d.backend_util.getReshapedPermuted(o.shape,r,a),h=d.backend_util.getSliceBeginCoords(n,r.length),p=d.backend_util.getSliceSize(c,n,r.length),m=[],f=P({inputs:{x:o},backend:e,attrs:{shape:u}}),g=Y({inputs:{x:f},backend:e,attrs:{perm:l}}),x=P({inputs:{x:g},backend:e,attrs:{shape:c}}),C=ue({inputs:{x},backend:e,attrs:{begin:h,size:p}});return m.push(f),m.push(g),m.push(x),m.forEach(b=>e.disposeData(b.dataId)),C},Qr={kernelName:d.BatchToSpaceND,backendName:"webgpu",kernelFunc:jr};const Zr=`
  fn bincount_write(index: i32, value: f32) {
    ${Z("&result[index]","value","float32")}
  }
`,Jr=`
  fn bincount_write(index: i32, value: f32) {
    atomicStore(&result[index], bitcast<i32>(value));
  }
`;class at{constructor(t,e,i=!1){this.outputShape=[],this.variableNames=["x"],this.uniforms="binCountSize : i32,",this.workgroupSize=[64,1,1],this.atomic=!0,this.hasWeights=!0,this.binaryOutput=!1,this.outputShape=t,this.rank=t.length,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.binaryOutput=i,i&&(this.atomic=!1),this.hasWeights=e,this.hasWeights&&this.variableNames.push("w"),this.shaderKey=`bincount_${this.hasWeights}_${this.binaryOutput}_${this.rank}`}getUserCode(){return`
    ${this.binaryOutput?Jr:Zr}
  ${y("index")} {
    ${this.rank===1?`if (index < uniforms.xShape) {
      let indexVal = i32(getX(index));
      if (indexVal < uniforms.binCountSize) {
        let value = ${this.binaryOutput?1:this.hasWeights?"getW(index)":"1."};
        bincount_write(indexVal, value);
      }
    }`:`let coord = getCoordsFromIndex(index);
    if (coordsInBounds2D(coord, uniforms.xShape)) {
      let indexVal = i32(getX(coord[0], coord[1]));
      if (indexVal < uniforms.binCountSize) {
        let value = ${this.binaryOutput?1:this.hasWeights?"getW(coord[0], coord[1])":"1."};
        bincount_write(coord.x * uniforms.binCountSize + indexVal, value);
      }
    }`}
  }
  `}}function en(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,weights:r}=t,{size:n}=i,a=d.util.sizeFromShape(o.shape),l=d.util.sizeFromShape(r.shape)>0,c=[n],h=r.dtype,p=G({backend:e,attrs:{shape:c,value:0,dtype:h}}),m=new at([a],l),f=[{type:"int32",data:[n]}],g=l?[o,r]:[o];return e.runWebGPUProgram(m,g,h,f,p)}const tn={kernelName:d.Bincount,backendName:"webgpu",kernelFunc:en};class sn{constructor(t){this.outputShape=[],this.variableNames=["s0","s1"],this.uniforms="s0Size : i32, s1Size : i32, ",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=[t],this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="broadcastArgs"}getUserCode(){return`
  ${y("index")} {
    if (index < uniforms.size) {
      var s0 = 1.0;
      var s1 = 1.0;
      let indexS0 = index - uniforms.size + uniforms.s0Size;
      let indexS1 = index - uniforms.size + uniforms.s1Size;
      if (indexS0 >= 0) {
        s0 = getS0(indexS0);
      }
      if (indexS1 >= 0) {
        s1 = getS1(indexS1);
      }

      if (s0 == 1.0) {
        setOutputAtIndex(index, s1);
      } else if (s1 == 1.0) {
        setOutputAtIndex(index, s0);
      } else if (s0 != s1) {
        setOutputAtIndex(index, uniforms.NAN);
      } else {
        setOutputAtIndex(index, s0);
      }
    }
  }
  `}}function on(s){const{inputs:t,backend:e}=s,{s0:i,s1:o}=t;if(e.shouldExecuteOnCPU([i,o])){const c=e.tensorMap.get(i.dataId),h=e.tensorMap.get(o.dataId),p=c.values,m=h.values,f=d.backend_util.assertAndGetBroadcastShape(Array.from(p),Array.from(m));return e.makeTensorInfo([f.length],"int32",Int32Array.from(f))}const r=d.util.sizeFromShape(i.shape),n=d.util.sizeFromShape(o.shape),a=Math.max(r,n),u=new sn(a),l=[{type:"int32",data:[r]},{type:"int32",data:[n]}];return e.runWebGPUProgram(u,[i,o],"int32",l)}const rn={kernelName:d.BroadcastArgs,backendName:"webgpu",kernelFunc:on};const ut=W({opType:N.NOT_EQUAL,dtype:"bool",cpuKernelImpl:Wi}),nn={kernelName:d.NotEqual,backendName:"webgpu",kernelFunc:ut};function me(s){const{inputs:t,backend:e}=s,{input:i}=t,o=e.tensorMap.get(i.dataId);return H({inputs:{x:o.complexTensorInfos.real},backend:e})}const an={kernelName:d.Real,backendName:"webgpu",kernelFunc:me};function un(s,t){const e=new ne(s.shape,S.TO_INT),i=t.runWebGPUProgram(e,[s],"int32");return{dataId:i.dataId,shape:i.shape,dtype:i.dtype}}function We(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{dtype:r}=i;if(r==="complex64"){if(o.dtype==="complex64")return H({inputs:{x:o},backend:e});const n=zt.zeros(o.shape),a=We({inputs:{x:o},backend:e,attrs:{dtype:"float32"}}),u=oe({inputs:{real:a,imag:n},backend:e});return n.dispose(),e.disposeData(a.dataId),u}if(o.dtype==="complex64"){const n=me({inputs:{input:o},backend:e}),a=We({inputs:{x:n},backend:e,attrs:{dtype:r}});return e.disposeData(n.dataId),a}if(!d.util.hasEncodingLoss(o.dtype,r)){const n=H({inputs:{x:o},backend:e});return{dataId:n.dataId,shape:n.shape,dtype:r}}if(e.shouldExecuteOnCPU([o])){const n=e.tensorMap.get(o.dataId).values,[a,u,l]=bi(n,o.shape,o.dtype,r);return e.makeTensorInfo(a,u,l)}if(r==="int32")return un(o,e);if(r==="bool"){const n=e.makeTensorInfo([],"bool",d.util.getTypedArrayFromDType("bool",1)),u=ut({inputs:{a:o,b:n},backend:e});return e.disposeData(n.dataId),u}throw new Error(`Error in Cast: failed to cast ${o.dtype} to ${r}`)}const dn={kernelName:d.Cast,backendName:"webgpu",kernelFunc:We};const ln=_({opType:S.CEIL,cpuKernelImpl:wi}),cn={kernelName:d.Ceil,backendName:"webgpu",kernelFunc:ln};class hn{constructor(t){this.variableNames=["A"],this.uniforms="minVal : f32, maxVal : f32,",this.workPerThread=4,this.workgroupSize=[64,1,1],this.outputComponent=4,this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,[this.workPerThread,1,1]),this.shaderKey="clipVec4"}getUserCode(){return`
      ${y("index")} {
        if(index < uniforms.size) {
          let value = getAByOutputIndex(index);
          var clampedValue = clamp(
              value, vec4<f32>(uniforms.minVal), vec4<f32>(uniforms.maxVal));
          clampedValue = select(clampedValue, value, isnanVec4(value));
          setOutputAtIndex(index, clampedValue);
        }
      }
    `}}class pn{constructor(t){this.variableNames=["A"],this.uniforms="minVal : f32, maxVal : f32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="clip"}getUserCode(){return`
      ${y("index")} {
        if(index < uniforms.size) {
          let value = getAByOutputIndex(index);
          if (isnan(value)) {
            setOutputAtIndex(index, value);
            return;
          }
          setOutputAtIndex(index, clamp(value, uniforms.minVal, uniforms.maxVal));
        }
      }
    `}}function mn(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{clipValueMin:r,clipValueMax:n}=i;let a;const u=[{type:"float32",data:[r]},{type:"float32",data:[n]}];return d.util.sizeFromShape(o.shape)%4===0?a=new hn(o.shape):a=new pn(o.shape),e.runWebGPUProgram(a,[o],o.dtype,u)}const fn={kernelName:d.ClipByValue,backendName:"webgpu",kernelFunc:mn};class gn{constructor(t){this.outputShape=[],this.variableNames=["real","imag"],this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="complexAbs"}getUserCode(){return`
    ${y("index")} {
      if (index < uniforms.size) {
        let re = abs(getRealByOutputIndex(index));
        let im = abs(getImagByOutputIndex(index));
        let mx = max(re, im);

        // The length function in wgsl may be not underflow-safe on some GPUs.
        // So the safe solution is to ensure underflow-safety in all cases.
        setOutputAtIndex(index, select(mx * length(vec2<f32>(1, min(re, im)/mx)), 0.0, mx == 0.0));
      }
    }
  `}}function dt(s,t){return{dataId:t.dataId,dtype:t.dtype,shape:s.shape}}function xn(s){const{inputs:t,backend:e}=s,{x:i}=t,o=e.tensorMap.get(i.dataId),r=new gn(i.shape),n=[dt(i,o.complexTensorInfos.real),dt(i,o.complexTensorInfos.imag)];return e.runWebGPUProgram(r,n,n[0].dtype)}const Cn={kernelName:d.ComplexAbs,backendName:"webgpu",kernelFunc:xn};class bn{constructor(t){this.uniforms="",this.workPerThread=1,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=d.backend_util.computeOutShape(t,1),this.variableNames=t.map((e,i)=>`T${i}`),this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,[this.workPerThread,1,1]),this.offsetLength=t.length-1;for(let e=0;e<this.offsetLength;e++)this.uniforms+=`offset${e} : i32,`;this.shaderKey="concat"}getUserCode(){const t=[];if(this.offsetLength>0){t.push("if (yC < uniforms.offset0){ setOutputAtCoords(coords.x, coords.y, getT0(yR, yC)); }");for(let r=1;r<this.offsetLength;r++)t.push(`else if (yC < uniforms.offset${[r]}){ setOutputAtCoords(coords.x, coords.y, getT${r}(yR, yC - uniforms.offset${r-1})); }`);const i=this.offsetLength,o=this.offsetLength-1;t.push(`else { setOutputAtCoords(coords.x, coords.y, getT${i}(yR, yC - uniforms.offset${o})); }`)}else t.push("setOutputAtCoords(coords.x, coords.y, getT0(yR, yC));");return`
      ${y("index")} {
        for(var i = 0; i < ${this.workPerThread}; i = i + 1) {
          let flatIndex = index * ${this.workPerThread} + i;
          if(flatIndex < uniforms.size) {
            let coords = getCoordsFromIndex(flatIndex);
            let yR = coords.x;
            let yC = coords.y;

            ${t.join(`
        `)}
          }
        }
      }
    `}}function Re(s){const{inputs:t,backend:e}=s,{input:i}=t,o=e.tensorMap.get(i.dataId);return H({inputs:{x:o.complexTensorInfos.imag},backend:e})}const wn={kernelName:d.Imag,backendName:"webgpu",kernelFunc:Re};function fe(s,t,e){const i=s[0].dtype;if(i==="complex64"){const f=s.map(w=>me({inputs:{input:w},backend:e})),g=s.map(w=>Re({inputs:{input:w},backend:e})),x=fe(f,t,e),C=fe(g,t,e),b=oe({inputs:{real:x,imag:C},backend:e});return f.forEach(w=>e.disposeData(w.dataId)),g.forEach(w=>e.disposeData(w.dataId)),e.disposeData(x.dataId),e.disposeData(C.dataId),b}let o=e.shouldExecuteOnCPU(s);if(i==="string"&&(o=!0),o){const f=s.map(k=>{const D=[-1,d.util.sizeFromShape(k.shape.slice(t))];return P({inputs:{x:k},backend:e,attrs:{shape:D}})}),g=f.map(k=>({vals:e.readSync(k.dataId),shape:k.shape})),x=d.backend_util.computeOutShape(f.map(k=>k.shape),1),C=f[0].shape[0]===1,b=Si(g,x,i,C),w=d.backend_util.computeOutShape(s.map(k=>k.shape),t),I=e.makeTensorInfo(w,i,b);return f.forEach(k=>e.disposeData(k.dataId)),I}const r=e.device.limits.maxStorageBuffersPerShaderStage-1;if(s.length>r){const f=[];for(let x=0;x<s.length;x+=r){const C=s.slice(x,x+r);f.push(fe(C,t,e))}const g=fe(f,t,e);for(const x of f)e.disposeData(x.dataId);return g}const{tensors2D:n,outShape:a}=Sn(s,t,e),u=n.map(f=>f.shape),l=new bn(u),c=[],h=new Array(u.length-1);if(h.length>0){h[0]=u[0][1],c.push({type:"int32",data:[h[0]]});for(let f=1;f<h.length;f++)h[f]=h[f-1]+u[f][1],c.push({type:"int32",data:[h[f]]})}const p=e.runWebGPUProgram(l,n,n[0].dtype,c);n.forEach(f=>e.disposeData(f.dataId));const m=P({inputs:{x:p},backend:e,attrs:{shape:a}});return e.disposeData(p.dataId),m}function Sn(s,t,e){const i=d.backend_util.computeOutShape(s.map(r=>r.shape),t);return{tensors2D:s.map(r=>P({inputs:{x:r},backend:e,attrs:{shape:[d.util.sizeFromShape(r.shape.slice(0,t)),d.util.sizeFromShape(r.shape.slice(t))]}})),outShape:i}}function lt(s){const{inputs:t,backend:e,attrs:i}=s,{axis:o}=i,r=d.util.parseAxisParam(o,t[0].shape)[0],n=t.map(l=>l.shape);d.backend_util.assertParamsConsistent(n,r);const a=d.backend_util.computeOutShape(t.map(l=>l.shape),r);if(d.util.sizeFromShape(a)===0)return e.makeTensorInfo(a,t[0].dtype,[]);const u=t.filter(l=>d.util.sizeFromShape(l.shape)>0);return u.length===1?H({inputs:{x:u[0]},backend:e}):fe(u,r,e)}const yn={kernelName:d.Concat,backendName:"webgpu",kernelFunc:lt};function vn(s,t,e,i,o=!1,r=null,n=!1,a=4,u=4,l=4){const c=A=>{switch(A){case 1:return"resData = f32(x[xIndex]);";case 3:return"resData = vec3<f32>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);";case 4:return"resData = vec4<f32>(x[xIndex / 4]);";default:throw new Error(`innerElementSize ${A} is not supported.`)}},h=A=>{switch(A){case 1:return"return f32(W[row * uniforms.wShape[3] + col]);";case 4:return"return vec4<f32>(W[(row * uniforms.wShape[3] + col) / 4]);";default:throw new Error(`innerElementSize ${A} is not supported.`)}},p=s?`
      let coord = vec4<i32>(batch, xRow, xCol, xCh);
      `:`
      let coord = vec4<i32>(batch, xCh, xRow, xCol);
      `,m=s?`
      let coords = vec4<i32>(
        batch,
        row / outWidth,
        row % outWidth,
        col);
      `:`
      let coords = vec4<i32>(
        batch,
        row,
        col / outWidth,
        col % outWidth);
      `,f=s?"uniforms.xShape[1]":"uniforms.xShape[2]",g=s?"uniforms.xShape[2]":"uniforms.xShape[3]",x=s?"row":"col",C=s?"col":"row",b=`
      let inChannels = uniforms.wShape[2];
      let outWidth = ${s?"uniforms.outShape[2]":"uniforms.outShape[3]"};
      let outRow = ${x} / outWidth;
      let outCol = ${x} % outWidth;

      let WRow = ${C} / (uniforms.filterDims[1] * inChannels);
      let WCol = ${C} / inChannels % uniforms.filterDims[1];
      let xRow = outRow * uniforms.strides[0] + uniforms.dilations[0] * WRow - uniforms.pads[0];
      let xCol = outCol * uniforms.strides[1] + uniforms.dilations[1] * WCol - uniforms.pads[1];
      let xCh = ${C} % inChannels;
      var resData = ${z(a)}(0.0);
      // The bounds checking is always needed since we use it to pad zero for
      // the 'same' padding type.
      if (xRow >= 0 && xRow < ${f} && xCol >= 0 && xCol < ${g}) {
        ${p}
        let xIndex = getIndexFromCoords4D(coord, uniforms.xShape);
        ${c(a)}
      }
      return resData;`,w=s?t&&i?`
      ${b}`:`
      if (row < uniforms.dimAOuter && col < uniforms.dimInner) {
        ${b}
      }
      return ${z(a)}(0.0);`:i&&e?`
      ${b}`:`
      if (row < uniforms.dimInner && col < uniforms.dimBOuter) {
        ${b}
      }
      return ${z(a)}(0.0);`,I=`${h(u)}`,k=z(l),$=z(s?a:u),D=z(s?u:a);return`
      ${Q(r,n,l===4,4)}
      fn mm_readA(batch: i32, row : i32, col : i32) -> ${$} {
        ${s?w:I}
      }

      fn mm_readB(batch: i32, row : i32, col : i32) -> ${D} {
        ${s?I:w}
      }

      fn mm_write(batch: i32, row : i32, col : i32, valueIn : ${k}) {
        if (row < uniforms.dimAOuter && col < uniforms.dimBOuter)
        {
        var value = valueIn;
        let outWidth = ${s?"uniforms.outShape[2]":"uniforms.outShape[3]"};
        ${m}
        ${se(o,r)}
        setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
        }
      }`}class In{constructor(t,e,i,o,r=!1,n=null,a=!1,u=!1){this.variableNames=["x","W"],this.uniforms="filterDims : vec2<i32>, pads : vec2<i32>, strides : vec2<i32>, dilations : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32,",this.outputShape=t.outShape,this.isChannelsLast=t.dataFormat==="channelsLast",this.isVec4=((t.inChannels%4===0||t.inChannels%3===0)&&this.isChannelsLast||t.outWidth%4===0&&!this.isChannelsLast)&&t.outChannels%4===0,this.dispatchLayout=this.isChannelsLast?{x:[3],y:[1,2],z:[0]}:{x:[2,3],y:[1],z:[0]},this.workgroupSize=Ne(this.dispatchLayout,this.outputShape,this.isVec4),this.elementsPerThread=ze(this.dispatchLayout,this.outputShape,this.isVec4),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,this.elementsPerThread),this.isVec4?(this.outputComponent=4,this.isChannelsLast&&t.inChannels%4!==0?(this.innerElementSize=3,this.variableComponents=[1,4]):(this.innerElementSize=4,this.variableComponents=[4,4]),r&&(this.variableNames.push("bias"),this.variableComponents.push(4)),a&&(this.variableNames.push("preluActivationWeights"),this.variableComponents.push(4))):(this.innerElementSize=this.elementsPerThread[0],r&&this.variableNames.push("bias"),a&&this.variableNames.push("preluActivationWeights")),this.sequentialAccessByThreads=u,this.addBias=r,this.activation=n,this.hasPreluActivationWeights=a,this.tileAOuter=this.workgroupSize[1]*this.elementsPerThread[1],this.tileBOuter=this.workgroupSize[0]*this.elementsPerThread[0],this.tileInner=Math.max(this.workgroupSize[0]*this.innerElementSize,this.workgroupSize[1]),this.fitAOuter=e%this.tileAOuter===0,this.fitBOuter=i%this.tileBOuter===0,this.fitInner=o%this.tileInner===0,this.shaderKey=`conv2DMM_${this.elementsPerThread}_${this.activation}}_${this.fitAOuter}_${this.fitBOuter}_${this.fitInner}_${this.isVec4}_${this.innerElementSize}_${this.isChannelsLast}_${this.sequentialAccessByThreads}`}getUserCode(){const t=this.isVec4?ye(this.elementsPerThread,this.workgroupSize,!this.isChannelsLast,this.tileInner):ve(this.elementsPerThread,this.workgroupSize,!this.isChannelsLast,this.tileInner,!1,null,this.sequentialAccessByThreads),e=this.isVec4?[this.innerElementSize,4,4]:[1,1,1];return`
    ${vn(this.isChannelsLast,this.fitAOuter,this.fitBOuter,this.fitInner,this.addBias,this.activation,this.hasPreluActivationWeights,e[0],e[1],e[2])}
    ${t}
  `}}class kn{constructor(t,e=!1,i=null,o=!1){this.variableNames=["x","W"],this.uniforms="filterDims: vec2<i32>, pads: vec2<i32>, strides: vec2<i32>, dilations: vec2<i32>,",this.workgroupSize=[4,4,8],this.outputShape=t.outShape,this.isChannelsLast=t.dataFormat==="channelsLast",this.dispatchLayout=this.isChannelsLast?{x:[2],y:[1],z:[0,3]}:{x:[3],y:[2],z:[0,1]},this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.addBias=e,this.activation=i,this.hasPreluActivationWeights=o,e&&this.variableNames.push("bias"),o&&this.variableNames.push("preluActivationWeights"),this.shaderKey=`conv2dnaive_${this.activation}_${this.isChannelsLast}`}getUserCode(){return`
       ${Q(this.activation,this.hasPreluActivationWeights,!1,4)}
       fn readInp(batch : i32, row : i32, col : i32, chan : i32) -> f32{
         let coords = vec4<i32>(batch, row, col, chan);
         if (coordsInBounds4D(coords, uniforms.xShape)) {
           return  getX(batch, row, col, chan);
         } else {
          return 0.0;
         }
       }
       fn readFilt(row : i32, col : i32, xChannel : i32, outChannel : i32) -> f32{
         let coords = vec4<i32>(row, col, xChannel, outChannel);
         if(coordsInBounds4D(coords, uniforms.wShape)) {
           return getW(row, col, xChannel, outChannel);
          } else {
            return 0.0;
          }
       }
       fn writeResult(batch : i32, row : i32, col : i32, chan : i32, valueIn : f32) {
         let coords = ${this.isChannelsLast?"vec4<i32>(batch, row, col, chan);":"vec4<i32>(batch, chan, row, col);"}
         if (coordsInBounds4D(coords, uniforms.outShape)) {
           var value = valueIn;
           ${se(this.addBias,this.activation)}
           setOutputAtCoords(coords.x, coords.y, coords.z, coords.w, value);
         }
       }
       ${y("index")} {
         let coords = getOutputCoords();
         let batch = coords[0];
         let outChannel = ${this.isChannelsLast?"coords[3];":"coords[1];"}
         let outRow = ${this.isChannelsLast?"coords[1];":"coords[2];"}
         let outCol = ${this.isChannelsLast?"coords[2];":"coords[3];"}
         var acc : f32 = 0.0;
         for (var row = 0; row < uniforms.filterDims[0]; row = row + 1) {
           for (var col = 0; col < uniforms.filterDims[1]; col = col + 1) {
             let xRow = outRow * uniforms.strides[0] + uniforms.dilations[0] * row - uniforms.pads[0];
             let xCol = outCol * uniforms.strides[1] + uniforms.dilations[1] * col - uniforms.pads[1];
             for (var xChannel = 0; xChannel < ${this.isChannelsLast?"uniforms.xShape[3];":"uniforms.xShape[1];"} xChannel = xChannel + 1) {
               ${this.isChannelsLast?"let v = readInp(batch, xRow, xCol, xChannel);":"let v = readInp(batch, xChannel, xRow, xCol);"}
               let f = readFilt(row, col, xChannel, outChannel);
               acc = acc + v * f;
             }
           }
         }
         writeResult(batch, outRow, outCol, outChannel, acc);
       }
     `}}class Rn{constructor(t,e){this.variableNames=["x"],this.uniforms=`pads : vec2<i32>, strides : vec2<i32>, dilations : vec2<i32>, outWidth : i32, itemsPerBlockRow : i32,
       inChannels : i32,`,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.isChannelsLast=e,this.shaderKey=`im2col_${this.isChannelsLast}`}getUserCode(){const t=this.isChannelsLast?1:2,e=this.isChannelsLast?2:3,i=this.isChannelsLast?"coords[1]":"coords[2]",o=this.isChannelsLast?"coords[2]":"coords[1]",r=this.isChannelsLast?"getX(batch, xRow, xCol, ch)":"getX(batch, ch, xRow, xCol)";return`
    ${y("index")} {
      let coords = getCoordsFromIndex(index);
      if(index < uniforms.size) {
        let batch = coords[0];
        let row = ${i};
        let col = ${o};
        let offsetY = (row / uniforms.outWidth) * uniforms.strides[0] - uniforms.pads[0];
        let xRow = offsetY + uniforms.dilations[0] * (col / uniforms.itemsPerBlockRow);
        var value = 0.0;
        if(xRow < uniforms.xShape[${t}] && xRow >= 0) {
          let offsetX = (row % uniforms.outWidth) * uniforms.strides[1] -
              uniforms.pads[1];
          let xCol = offsetX + uniforms.dilations[1] * ((col %
              uniforms.itemsPerBlockRow) / uniforms.inChannels);
          let ch = col % uniforms.inChannels;
          if(xCol < uniforms.xShape[${e}] && xCol >= 0) {
            value = ${r};
          }
        }
        setOutputAtIndex(index, value);
      }
    }
   `}}function Pe(s,t){const e=s.length;return e>=3?t?[...s.slice(0,-3),s[e-3]*s[e-2],s[e-1]]:[...s.slice(0,-3),s[e-3],s[e-2]*s[e-1]]:!t&&e===1&&s[0]>1?[s[0],1]:null}function Pn({x:s,filter:t,convInfo:e,backend:i,bias:o=null,preluActivationWeights:r=null,leakyreluAlpha:n=0,activation:a=null}){const u=e.dataFormat==="channelsLast",l=!u,c=!1,h=u&&e.filterHeight===e.inHeight&&e.filterWidth===e.inWidth&&e.padInfo.type==="VALID",p=[];let m,f;if(h){const C=e.inHeight*e.inWidth*e.inChannels;m=P({inputs:{x:s},backend:i,attrs:{shape:[1,e.batchSize,C]}}),f=P({inputs:{x:t},backend:i,attrs:{shape:[1,C,e.outChannels]}})}else m=P({inputs:{x:s},backend:i,attrs:{shape:u?[e.batchSize,e.inHeight*e.inWidth,e.inChannels]:[e.batchSize,e.inChannels,e.inHeight*e.inWidth]}}),f=P({inputs:{x:t},backend:i,attrs:{shape:[1,e.inChannels,e.outChannels]}});if(p.push(m),p.push(f),r!=null){const C=Pe(r.shape,u);C!=null&&(r=P({inputs:{x:r},backend:i,attrs:{shape:C}}),p.push(r))}if(o!=null){const C=Pe(o.shape,u);C!=null&&(o=P({inputs:{x:o},backend:i,attrs:{shape:C}}),p.push(o))}const g=Ie({a:u?m:f,b:u?f:m,transposeA:l,transposeB:c,backend:i,bias:o,activation:a,preluActivationWeights:r,leakyreluAlpha:n}),x=P({inputs:{x:g},backend:i,attrs:{shape:e.outShape}});p.push(g);for(const C of p)i.disposeData(C.dataId);return x}function $n({x:s,filter:t,convInfo:e,backend:i,bias:o=null,preluActivationWeights:r=null,leakyreluAlpha:n=0,activation:a=null}){const{filterWidth:u,filterHeight:l,inChannels:c,strideWidth:h,strideHeight:p,padInfo:m,outWidth:f,outHeight:g,dilationWidth:x,dilationHeight:C,dataFormat:b}=e,w=b==="channelsLast",I=u*l*c,k=g*f,$=w?[e.batchSize,k,I]:[e.batchSize,I,k],D=new Rn($,w),F=[{type:"int32",data:[m.top,m.left]},{type:"int32",data:[p,h]},{type:"int32",data:[C,x]},{type:"int32",data:[f]},{type:"int32",data:[c*u]},{type:"int32",data:[c]}],A=i.runWebGPUProgram(D,[s],s.dtype,F),E=[];E.push(A);const T=P({inputs:{x:t},backend:i,attrs:{shape:[1,I,-1]}});if(E.push(T),r!=null){const U=Pe(r.shape,w);U!=null&&(r=P({inputs:{x:r},backend:i,attrs:{shape:U}}),E.push(r))}if(o!=null){const U=Pe(o.shape,w);U!=null&&(o=P({inputs:{x:o},backend:i,attrs:{shape:U}}),E.push(o))}const B=Ie({a:w?A:T,b:w?T:A,transposeA:!w,transposeB:!1,backend:i,bias:o,activation:a,preluActivationWeights:r,leakyreluAlpha:n}),M=P({inputs:{x:B},backend:i,attrs:{shape:e.outShape}});E.push(B);for(const U of E)i.disposeData(U.dataId);return M}function ct({x:s,filter:t,convInfo:e,backend:i,bias:o=null,preluActivationWeights:r=null,leakyreluAlpha:n=0,activation:a=null}){const u=o!=null,l=r!=null,c=e.dataFormat==="channelsLast",h=c&&e.filterHeight===e.inHeight&&e.filterWidth===e.inWidth&&e.padInfo.type==="VALID",p=d.env().getBool("WEBGPU_USE_NAIVE_CONV2D_DEBUG");if(!p&&(h||e.filterHeight===1&&e.filterWidth===1&&e.dilationHeight===1&&e.dilationWidth===1&&e.strideHeight===1&&e.strideWidth===1&&(e.padInfo.type==="SAME"||e.padInfo.type==="VALID")))return Pn({x:s,filter:t,convInfo:e,backend:i,bias:o,activation:a,preluActivationWeights:r,leakyreluAlpha:n});const m=d.env().getNumber("WEBGPU_THRESHOLD_TO_INCREASE_WORKGROUPS_FOR_MATMUL"),f=m>-1?m:i.thresholdToIncreaseWorkgroups,g=e.batchSize*Math.ceil(e.outHeight*e.outWidth/32)*Math.ceil(e.outChannels/32);if(d.env().getBool("WEBGPU_CONV_SEPARATE_IM2COL_SHADER")||g<=f)return $n({x:s,filter:t,convInfo:e,backend:i,bias:o,preluActivationWeights:r,leakyreluAlpha:n,activation:a});let x;const C=[e.padInfo.top,e.padInfo.left],b=[{type:"int32",data:[e.filterHeight,e.filterWidth]},{type:"int32",data:[...C]},{type:"int32",data:[e.strideHeight,e.strideWidth]},{type:"int32",data:[e.dilationHeight,e.dilationWidth]}];if(p)x=new kn(e,u,a,l);else{const $=c?e.outHeight*e.outWidth:e.outChannels,D=c?e.outChannels:e.outHeight*e.outWidth,F=e.filterHeight*e.filterWidth*e.inChannels;b.push({type:"int32",data:[$]},{type:"int32",data:[D]},{type:"int32",data:[F]});const A=i.adapterInfo.isIntel();x=new In(e,$,D,F,u,a,l,A)}const w=[],I=[s,t];u&&(!c&&o.shape.length===1&&(o=P({inputs:{x:o},backend:i,attrs:{shape:[o.shape[0],1,1]}}),w.push(o)),I.push(o)),l&&(!c&&r.shape.length===1&&(r=P({inputs:{x:r},backend:i,attrs:{shape:[r.shape[0],1,1]}}),w.push(r)),I.push(r)),a==="leakyrelu"&&(b.push({type:"float32",data:[n]}),x.uniforms+=" alpha : f32,");const k=i.runWebGPUProgram(x,I,s.dtype,b);for(const $ of w)i.disposeData($.dataId);return k}function Dn(s){const{inputs:t,attrs:e,backend:i}=s,{x:o,filter:r}=t,{strides:n,pad:a,dataFormat:u,dilations:l,dimRoundingMode:c}=e,h=d.backend_util.convertConv2DDataFormat(u),p=d.backend_util.computeConv2DInfo(o.shape,r.shape,n,l,a,c,!1,h);return ct({x:o,filter:r,convInfo:p,backend:i})}const Nn={kernelName:d.Conv2D,backendName:"webgpu",kernelFunc:Dn};class zn{constructor(t){this.variableNames=["dy","W"],this.uniforms="filterDims : vec2<i32>, pads : vec2<i32>, strides : vec2<i32>, outBackprop : vec4<i32>,",this.workgroupSize=[64,1,1],this.size=!1,this.isVec4=!1,this.workPerThread=1,this.outputShape=t.inShape,this.isChannelsLast=t.dataFormat==="channelsLast",this.isVec4=this.isChannelsLast&&t.outChannels%4===0&&t.inChannels%4===0,this.isVec4?(this.workPerThread=2,this.outputComponent=4,this.workgroupSize=[4,4,4],this.dispatchLayout={x:[3],y:[2],z:[0,1]},this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,[4,this.workPerThread,1])):(this.size=!0,this.workPerThread=1,this.workgroupSize=[64,1,1],this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize)),this.shaderKey=`conv2DDerInput_${this.isChannelsLast}_${this.isVec4}_${this.workPerThread}`}getUserCode(){const t=this.isChannelsLast?1:2,e=this.isChannelsLast?2:3,i=this.isChannelsLast?3:1,o=`
    ${y()} {
      let batch = i32(globalId.z) / uniforms.outShape[1];
      let r = i32(globalId.z) % uniforms.outShape[1];
      let c = i32(globalId.y) * ${this.workPerThread};
      let d1 = i32(globalId.x) * 4;

      let dyCorner = vec2<i32>(r, c) - uniforms.pads;

      // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
      // ? = to be determined. : = across all values in that axis.
      var dotProd: array<vec4<f32>, ${this.workPerThread}>;
      for (var i = 0; i < ${this.workPerThread}; i++) {
        dotProd[i] = vec4<f32>(0.0);
      }
      for (var wR = 0; wR < uniforms.filterDims.x; wR = wR + 1) {
        let dyR = f32(dyCorner.x + wR) / f32(uniforms.strides.x);
        let wRPerm = uniforms.filterDims.x - 1 - wR;
        if (dyR < 0.0 || dyR >= f32(uniforms.outBackprop[1]) ||
            fract(dyR) > 0.0) {
          continue;
        }
        let idyR = i32(dyR);

        for (var wC = 0; wC < uniforms.filterDims.y; wC = wC + 1) {
          let dyC = f32(dyCorner.y + wC) / f32(uniforms.strides.y);
          let dyC2 = f32(dyCorner.y + 1 + wC) / f32(uniforms.strides.y);
          let wCPerm = uniforms.filterDims.y - 1 - wC;
          var bDyCVal = true;
          var bDyCVal2 = true;
          if (dyC < 0.0 || dyC >= f32(uniforms.outBackprop[2]) ||
              fract(dyC) > 0.0) {
            bDyCVal = false;
          }
          if (dyC2 < 0.0 || dyC2 >= f32(uniforms.outBackprop[2]) ||
              fract(dyC2) > 0.0) {
            bDyCVal2 = false;
          }

          let idyC = i32(dyC);
          let idyC2 = i32(dyC2);
          if (bDyCVal && bDyCVal2) {
            let d2Length = uniforms.outBackprop[3];
            for (var d2 = 0; d2 < d2Length; d2 = d2 + 4) {
              let wValue0 = getW(wRPerm, wCPerm, d1, d2);
              let wValue1 = getW(wRPerm, wCPerm, d1 + 1, d2);
              let wValue2 = getW(wRPerm, wCPerm, d1 + 2, d2);
              let wValue3 = getW(wRPerm, wCPerm, d1 + 3, d2);
              var xValue =  getDy(batch, idyR, idyC, d2);
              let tmpval = vec4<f32>(dot(xValue, wValue0),
                                     dot(xValue, wValue1),
                                     dot(xValue, wValue2),
                                     dot(xValue, wValue3));
              dotProd[0] = dotProd[0] + tmpval;
              xValue = getDy(batch, idyR, idyC2, d2);
              dotProd[1] = dotProd[1] + vec4<f32>(dot(xValue, wValue0),
                                                  dot(xValue, wValue1),
                                                  dot(xValue, wValue2),
                                                  dot(xValue, wValue3));
            }
          } else if (bDyCVal) {
            let d2Length = uniforms.outBackprop[3];
            for (var d2 = 0; d2 < d2Length; d2 = d2 + 4) {
              let wValue0 = getW(wRPerm, wCPerm, d1, d2);
              let wValue1 = getW(wRPerm, wCPerm, d1 + 1, d2);
              let wValue2 = getW(wRPerm, wCPerm, d1 + 2, d2);
              let wValue3 = getW(wRPerm, wCPerm, d1 + 3, d2);
              var xValue =  getDy(batch, idyR, idyC, d2);
              let tmpval = vec4<f32>(dot(xValue, wValue0),
                                     dot(xValue, wValue1),
                                     dot(xValue, wValue2),
                                     dot(xValue, wValue3));
              dotProd[0] = dotProd[0] + tmpval;
            }
          } else if (bDyCVal2) {
            let d2Length = uniforms.outBackprop[3];
            for (var d2 = 0; d2 < d2Length; d2 = d2 + 4) {
              let wValue0 = getW(wRPerm, wCPerm, d1, d2);
              let wValue1 = getW(wRPerm, wCPerm, d1 + 1, d2);
              let wValue2 = getW(wRPerm, wCPerm, d1 + 2, d2);
              let wValue3 = getW(wRPerm, wCPerm, d1 + 3, d2);
              var xValue =  getDy(batch, idyR, idyC2, d2);
              let tmpval = vec4<f32>(dot(xValue, wValue0),
                                     dot(xValue, wValue1),
                                     dot(xValue, wValue2),
                                     dot(xValue, wValue3));
              dotProd[1] = dotProd[1] + tmpval;
            }
          }
        }
      }

      for (var i = 0; i < ${this.workPerThread}; i = i + 1) {
        let coords = vec4<i32>(batch, r, c + i, d1);
        if (coordsInBounds4D(coords, uniforms.outShape)) {
          setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], dotProd[i]);
        }
      }
    }
    `;return this.isVec4?`
    ${o}
    `:`
    ${y("index")} {
      if(index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        let batch = coords[0];
        let d1 = coords[${i}];

        let dyCorner = vec2<i32>(coords[${t}], coords[${e}]) - uniforms.pads;
        let dyRCorner = dyCorner.x;
        let dyCCorner = dyCorner.y;

        // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
        // ? = to be determined. : = across all values in that axis.
        var dotProd = 0.0;
        for (var wR = 0; wR < uniforms.filterDims.x; wR = wR + 1) {
          let dyR = (f32(dyRCorner) + f32(wR)) / f32(uniforms.strides.x);
          let wRPerm = uniforms.filterDims.x - 1 - wR;
          if (dyR < 0.0 || dyR >= f32(uniforms.outBackprop[1]) || fract(dyR) > 0.0 ||
              wRPerm < 0) {
            continue;
          }
          let idyR = i32(dyR);

          for (var wC = 0; wC < uniforms.filterDims.y; wC = wC + 1) {
            let dyC = (f32(dyCCorner) + f32(wC)) / f32(uniforms.strides.y);
            let wCPerm = uniforms.filterDims.y - 1 - wC;
            if (dyC < 0.0 || dyC >= f32(uniforms.outBackprop[2]) ||
                fract(dyC) > 0.0 || wCPerm < 0) {
              continue;
            }
            let idyC = i32(dyC);

            for (var d2 = 0; d2 < uniforms.outBackprop[3]; d2 = d2 + 1) {
              let xValue = ${this.isChannelsLast?"getDy(batch, idyR, idyC, d2)":"getDy(batch, d2, idyR, idyC)"};
              let wValue = getW(wRPerm, wCPerm, d1, d2);
              dotProd = dotProd + xValue * wValue;
            }
          }
        }
        setOutputAtIndex(index, dotProd);
      }
    }
  `}}class An{constructor(t){this.variableNames=["x","dy"],this.uniforms="pads : vec2<i32>, strides : vec2<i32>, batchSize : i32, outHeight : i32, outWidth : i32, inHeight : i32, inWidth : i32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.filterShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.isChannelsLast=t.dataFormat==="channelsLast",this.shaderKey=`conv2DDerFilter_${this.isChannelsLast}`}getUserCode(){return`
    ${y("index")} {
      if(index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        let wR = coords[0];
        let wC = coords[1];
        let d1 = coords[2];
        let d2 = coords[3];

        // Convolve x(?, ?, d1) with dy(:, :, d2) to get dw(wR, wC, d1, d2).
        // ? = to be determined. : = across all values in that axis.
        var dotProd = 0.0;
        for (var b = 0; b < uniforms.batchSize; b = b + 1) {
          for (var yR = 0; yR < uniforms.outHeight; yR = yR + 1) {
            let xR = wR + yR * uniforms.strides[0] - uniforms.pads[0];
            if (xR < 0 || xR >= uniforms.inHeight) {
              continue;
            }

            for (var yC = 0; yC < uniforms.outWidth; yC = yC + 1) {
              let xC = wC + yC * uniforms.strides[1] - uniforms.pads[1];

              if (xC < 0 || xC >= uniforms.inWidth) {
                continue;
              }

              if (${this.isChannelsLast}) {
                let dyValue = getDy(b, yR, yC, d2);
                let xValue = getX(b, xR, xC, d1);
                dotProd = dotProd + xValue * dyValue;
              } else {
                let dyValue = getDy(b, d2, yR, yC);
                let xValue = getX(b, d1, xR, xC);
                dotProd = dotProd + xValue * dyValue;
              }
            }
          }
        }
        setOutputAtIndex(index, dotProd);
      }
    }
  `}}class Fn{constructor(t){this.variableNames=["x","dy"],this.uniforms=`pads : vec3<i32>, strides : vec3<i32>, batchSize : i32, outDepth : i32,
       outHeight : i32, outWidth : i32, inDepth : i32, inHeight : i32, inWidth : i32,`,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.filterShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="conv3DDerFilter"}getUserCode(){return`
    ${y("index")} {
      if(index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        let wF = coords.x;
        let wR = coords.y;
        let wC = coords.z;
        let d1 = coords.w;
        let d2 = coords.u;

        var dotProd = 0.0;
        for (var b = 0; b < uniforms.batchSize; b++) {
          for (var yF = 0; yF < uniforms.outDepth; yF++) {
            let xF = wF + yF * uniforms.strides[0] - uniforms.pads[0];
            if (xF < 0 || xF >= uniforms.inDepth) {
              continue;
            }

            for (var yR = 0; yR < uniforms.outHeight; yR++) {
              let xR = wR + yR * uniforms.strides[1] - uniforms.pads[1];
              if (xR < 0 || xR >= uniforms.inHeight) {
                continue;
              }

              for (var yC = 0; yC < uniforms.outWidth; yC++) {
                let xC = wC + yC * uniforms.strides[2] - uniforms.pads[2];
                if (xC < 0 || xC >= uniforms.inWidth) {
                  continue;
                }

                let dyValue = getDy(b, yF, yR, yC, d2);
                let xValue = getX(b, xF, xR, xC, d1);
                dotProd += xValue * dyValue;
              }
            }
          }
        }
        setOutputAtIndex(index, dotProd);
      }
    }
  `}}class _n{constructor(t){this.variableNames=["dy","W"],this.uniforms=`filterDims : vec3<i32>, pads : vec3<i32>, strides : vec3<i32>,
      outDepth : i32, outHeight : i32, outWidth : i32, outChannels : i32,`,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.inShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="conv3DDerInput"}getUserCode(){return`
    ${y("index")} {
      if(index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        let batch = coords.x;
        let d1 = coords.u;

        let dyCorner = vec3<i32>(coords.y, coords.z, coords.w) - uniforms.pads;
        let dyFCorner = dyCorner.x;
        let dyRCorner = dyCorner.y;
        let dyCCorner = dyCorner.z;

        var dotProd = 0.0;
        for (var wF = 0; wF < uniforms.filterDims[0]; wF++) {
          let dyF = f32(dyFCorner + wF) / f32(uniforms.strides[0]);
          if (dyF < 0.0 || dyF >= f32(uniforms.outDepth) || fract(dyF) > 0.0) {
            continue;
          }
          let idyF = i32(dyF);

          let wFPerm = uniforms.filterDims[0] - 1 - wF;

          for (var wR = 0; wR < uniforms.filterDims[1]; wR++) {
            let dyR = f32(dyRCorner + wR) / f32(uniforms.strides[1]);

            if (dyR < 0.0 || dyR >= f32(uniforms.outHeight) || fract(dyR) > 0.0) {
              continue;
            }
            let idyR = i32(dyR);

            let wRPerm = uniforms.filterDims[1] - 1 - wR;

            for (var wC = 0; wC < uniforms.filterDims[2]; wC++) {
              let dyC = f32(dyCCorner + wC) / f32(uniforms.strides[2]);

              if (dyC < 0.0 || dyC >= f32(uniforms.outWidth) || fract(dyC) > 0.0) {
                continue;
              }
              let idyC = i32(dyC);

              let wCPerm = uniforms.filterDims[2] - 1 - wC;

              for (var d2 = 0; d2 < uniforms.outChannels; d2++) {
                let xValue = getDy(batch, idyF, idyR, idyC, d2);
                let wValue = getW(wFPerm, wRPerm, wCPerm, d1, d2);
                dotProd += xValue * wValue;
              }
            }
          }
        }
        setOutputAtIndex(index, dotProd);
      }
    }
  `}}function Ln(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,dy:r}=t,{strides:n,pad:a,dataFormat:u,dimRoundingMode:l,filterShape:c}=i,h=d.backend_util.convertConv2DDataFormat(u),p=d.backend_util.computeConv2DInfo(o.shape,c,n,1,a,l,!1,h),m=new An(p),f=[{type:"int32",data:[p.padInfo.top,p.padInfo.left]},{type:"int32",data:[p.strideHeight,p.strideWidth]},{type:"int32",data:[p.batchSize]},{type:"int32",data:[p.outHeight]},{type:"int32",data:[p.outWidth]},{type:"int32",data:[p.inHeight]},{type:"int32",data:[p.inWidth]}];return e.runWebGPUProgram(m,[o,r],o.dtype,f)}const En={kernelName:d.Conv2DBackpropFilter,backendName:"webgpu",kernelFunc:Ln};function Tn(s=4){const t=r=>{switch(r){case 1:return"return W[getIndexFromCoords4D(coord, uniforms.wShape)];";case 4:return`
            let coord1 = vec4<i32>(coordX, coordY, col + 1, rowInner);
            let coord2 = vec4<i32>(coordX, coordY, col + 2, rowInner);
            let coord3 = vec4<i32>(coordX, coordY, col + 3, rowInner);
            let v0 = W[getIndexFromCoords4D(coord, uniforms.wShape)];
            let v1 = W[getIndexFromCoords4D(coord1, uniforms.wShape)];
            let v2 = W[getIndexFromCoords4D(coord2, uniforms.wShape)];
            let v3 = W[getIndexFromCoords4D(coord3, uniforms.wShape)];
            return vec4<f32>(v0, v1, v2, v3);
            `;default:throw new Error(`innerElementSize ${r} is not supported.`)}},i=`if (row < uniforms.dimAOuter && col < uniforms.dimInner) {
        ${`
      let outRow = row / uniforms.outShape[2];
      let outCol = row % uniforms.outShape[2];

      let WRow = col / (uniforms.filterDims[1] * uniforms.outBackprop[3]);
      let WCol = col / uniforms.outBackprop[3] % uniforms.filterDims[1];
      let xR = f32(outRow - uniforms.pads[0] + WRow) / f32(uniforms.strides[0]);
      let xC = f32(outCol - uniforms.pads[1] + WCol) / f32(uniforms.strides[1]);
      if (xR < 0.0 || xR >= f32(uniforms.outBackprop[1]) || fract(xR) > 0.0) {
        return ${z(s)}(0.0);
      }
      if (xC < 0.0 || xC >= f32(uniforms.outBackprop[2]) || fract(xC) > 0.0) {
        return ${z(s)}(0.0);
      }
      let coord = vec4<i32>(
          batch,
          i32(xR),
          i32(xC),
          col % uniforms.outBackprop[3]);
      return x[getIndexFromCoords4D(coord, uniforms.xShape)/${s}];`}
      }
      return ${z(s)}(0.0);`;return`
  fn mm_readA(batch: i32, row : i32, col : i32) -> ${z(s)} {
    ${i}
  }

  fn mm_readB(batch: i32, row : i32, col : i32) -> ${z(s)} {
    let coordX = uniforms.filterDims.x - 1 -
        row / (uniforms.filterDims[1] * uniforms.outBackprop[3]);
    let coordY = uniforms.filterDims.y - 1 -
        (row / uniforms.outBackprop[3]) % uniforms.filterDims[1];
    if (row < uniforms.dimInner && col < uniforms.dimBOuter &&
        coordX >= 0 && coordY >= 0) {
      let rowInner = row % uniforms.outBackprop[3];
      let coord = vec4<i32>(coordX, coordY, col, rowInner);
      ${t(s)}
    }
    return ${z(s)}(0.0);
  }

  fn mm_write(batch: i32, row : i32, col : i32, valueInput : ${z(s)}) {
    if (row < uniforms.dimAOuter && col < uniforms.dimBOuter) {
      var value = valueInput;
      let outCoord = vec4<i32>(
          batch,
          row / uniforms.outShape[2],
          row % uniforms.outShape[2],
          col);
      result[getIndexFromCoords4D(outCoord, uniforms.outShape)/${s}] = value;
    }
  }`}class Bn{constructor(t){this.variableNames=["x","W"],this.uniforms="filterDims : vec2<i32>, pads : vec2<i32>, strides : vec2<i32>, outBackprop : vec4<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32,",this.outputShape=t.inShape,d.util.assert(t.dataFormat==="channelsLast",()=>"TODO: NCHW is unimplemented"),this.isVec4=t.inChannels%4===0&&t.outChannels%4===0,this.dispatchLayout={x:[3],y:[1,2],z:[0]},this.workgroupSize=Ne(this.dispatchLayout,this.outputShape,this.isVec4),this.elementsPerThread=ze(this.dispatchLayout,this.outputShape,this.isVec4),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,this.elementsPerThread),this.isVec4&&(this.outputComponent=4,this.variableComponents=[4,1]),this.shaderKey=`conv2DDerInputMM_${this.isVec4}_${this.elementsPerThread}`}getUserCode(){const t=this.isVec4?ye(this.elementsPerThread,this.workgroupSize):ve(this.elementsPerThread,this.workgroupSize);return`
    ${Tn(this.isVec4?4:1)}
    ${t}
    `}}function Wn(s){const{inputs:t,backend:e,attrs:i}=s,{dy:o,filter:r}=t,{inputShape:n,strides:a,pad:u,dataFormat:l,dimRoundingMode:c}=i,h=d.backend_util.convertConv2DDataFormat(l),p=d.backend_util.computeConv2DInfo(n,r.shape,a,1,u,c,!1,h),m=[{type:"int32",data:[p.filterHeight,p.filterWidth]},{type:"int32",data:[p.filterHeight-1-p.padInfo.top,p.filterWidth-1-p.padInfo.left]},{type:"int32",data:[p.strideHeight,p.strideWidth]},{type:"int32",data:[p.batchSize,p.outHeight,p.outWidth,p.outChannels]}];let f;if(d.env().getBool("WEBGPU_USE_NAIVE_CONV2D_TRANSPOSE")||p.dataFormat!=="channelsLast")f=new zn(p);else{f=new Bn(p);const g=p.inHeight*p.inWidth,x=p.inChannels,C=p.filterHeight*p.filterWidth*p.outChannels;m.push({type:"uint32",data:[g]},{type:"uint32",data:[x]},{type:"uint32",data:[C]})}return e.runWebGPUProgram(f,[o,r],"float32",m)}const Mn={kernelName:d.Conv2DBackpropInput,backendName:"webgpu",kernelFunc:Wn};class Vn{constructor(t){this.variableNames=["x","W"],this.uniforms="filterDims: vec3<i32>, pads: vec3<i32>, strides: vec3<i32>, dilations: vec3<i32>,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.outShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="conv3dnaive"}getUserCode(){return`
    ${y("index")} {
      if (index < uniforms.size) {
        let coords = getOutputCoords();
        let batch = coords.x;
        let d2 = coords.u;

        let xFRCCorner = vec3<i32>(coords.y, coords.z, coords.w) * uniforms.strides - uniforms.pads;
        let xFCorner = xFRCCorner.x;
        let xRCorner = xFRCCorner.y;
        let xCCorner = xFRCCorner.z;

        let inputDepthNearestVec4 = (uniforms.xShape.u / 4) * 4;
        let inputDepthVec4Remainder = uniforms.xShape.u % 4;

        var dotProd = 0.0;
        for (var wF = 0; wF < uniforms.filterDims[0]; wF++) {
          let xF = xFCorner + wF * uniforms.dilations[0];
          if (xF < 0 || xF >= uniforms.xShape.y) {
            continue;
          }

          for (var wR = 0; wR < uniforms.filterDims[1]; wR++) {
            let xR = xRCorner + wR * uniforms.dilations[1];
            if (xR < 0 || xR >= uniforms.xShape.z) {
              continue;
            }

            for (var wC = 0; wC < uniforms.filterDims[2]; wC++) {
              let xC = xCCorner + wC * uniforms.dilations[2];
              if (xC < 0 || xC >= uniforms.xShape.w) {
                continue;
              }

              for (var d1 = 0; d1 < inputDepthNearestVec4; d1 += 4) {
                let xValues = vec4<f32>(
                  getX(batch, xF, xR, xC, d1),
                  getX(batch, xF, xR, xC, d1 + 1),
                  getX(batch, xF, xR, xC, d1 + 2),
                  getX(batch, xF, xR, xC, d1 + 3)
                );
                let wValues = vec4<f32>(
                  getW(wF, wR, wC, d1, d2),
                  getW(wF, wR, wC, d1 + 1, d2),
                  getW(wF, wR, wC, d1 + 2, d2),
                  getW(wF, wR, wC, d1 + 3, d2)
                );

                dotProd += dot(xValues, wValues);
              }

              if (inputDepthVec4Remainder == 1) {
                dotProd += getX(batch, xF, xR, xC, inputDepthNearestVec4) *
                  getW(wF, wR, wC, inputDepthNearestVec4, d2);
              } else if (inputDepthVec4Remainder == 2) {
                let xValues = vec2<f32>(
                  getX(batch, xF, xR, xC, inputDepthNearestVec4),
                  getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1)
                );
                let wValues = vec2<f32>(
                  getW(wF, wR, wC, inputDepthNearestVec4, d2),
                  getW(wF, wR, wC, inputDepthNearestVec4 + 1, d2)
                );
                dotProd += dot(xValues, wValues);
              } else if (inputDepthVec4Remainder == 3) {
                let xValues = vec3<f32>(
                  getX(batch, xF, xR, xC, inputDepthNearestVec4),
                  getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                  getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2)
                );
                let wValues = vec3<f32>(
                  getW(wF, wR, wC, inputDepthNearestVec4, d2),
                  getW(wF, wR, wC, inputDepthNearestVec4 + 1, d2),
                  getW(wF, wR, wC, inputDepthNearestVec4 + 2, d2)
                );
                dotProd += dot(xValues, wValues);
              }
            }
          }
        }
        setOutputAtIndex(index, dotProd);
      }
    }`}}function Un(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,filter:r}=t,{strides:n,pad:a,dilations:u}=i,l=d.backend_util.computeConv3DInfo(o.shape,r.shape,n,u,a),c=[l.padInfo.front,l.padInfo.top,l.padInfo.left],h=[{type:"int32",data:[l.filterDepth,l.filterHeight,l.filterWidth]},{type:"int32",data:[...c]},{type:"int32",data:[l.strideDepth,l.strideHeight,l.strideWidth]},{type:"int32",data:[l.dilationDepth,l.dilationHeight,l.dilationWidth]}],p=new Vn(l),m=d.upcastType(o.dtype,r.dtype);return e.runWebGPUProgram(p,[o,r],m,h)}const On={kernelName:d.Conv3D,backendName:"webgpu",kernelFunc:Un};function Gn(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,dy:r}=t,{strides:n,pad:a,filterShape:u}=i,l=d.backend_util.computeConv3DInfo(o.shape,u,n,1,a),c=new Fn(l),h=[{type:"int32",data:[l.padInfo.front,l.padInfo.top,l.padInfo.left]},{type:"int32",data:[l.strideDepth,l.strideHeight,l.strideWidth]},{type:"int32",data:[l.batchSize]},{type:"int32",data:[l.outDepth]},{type:"int32",data:[l.outHeight]},{type:"int32",data:[l.outWidth]},{type:"int32",data:[l.inDepth]},{type:"int32",data:[l.inHeight]},{type:"int32",data:[l.inWidth]}];return e.runWebGPUProgram(c,[o,r],r.dtype,h)}const Hn={kernelName:d.Conv3DBackpropFilterV2,backendName:"webgpu",kernelFunc:Gn};function Xn(s){const{inputs:t,backend:e,attrs:i}=s,{dy:o,filter:r}=t,{strides:n,pad:a,inputShape:u}=i,l=d.backend_util.computeConv3DInfo(u,r.shape,n,1,a),c=new _n(l),h=[{type:"int32",data:[l.filterDepth,l.filterHeight,l.filterWidth]},{type:"int32",data:[l.filterDepth-1-l.padInfo.front,l.filterHeight-1-l.padInfo.top,l.filterWidth-1-l.padInfo.left]},{type:"int32",data:[l.strideDepth,l.strideHeight,l.strideWidth]},{type:"int32",data:[l.outDepth]},{type:"int32",data:[l.outHeight]},{type:"int32",data:[l.outWidth]},{type:"int32",data:[l.outChannels]}];return e.runWebGPUProgram(c,[o,r],o.dtype,h)}const Kn={kernelName:d.Conv3DBackpropInputV2,backendName:"webgpu",kernelFunc:Xn};const qn=_({opType:S.COS}),Yn={kernelName:d.Cos,backendName:"webgpu",kernelFunc:qn};const jn=_({opType:S.COSH}),Qn={kernelName:d.Cosh,backendName:"webgpu",kernelFunc:jn};class Zn{constructor(t,e,i,o){this.variableNames=["Image","Boxes","BoxInd"],this.uniforms="extrapolationValue : f32,",this.workgroupSize=[64,1,1],this.size=!0;const[r]=e;this.outputShape=[r,i[0],i[1],t],this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.methodId=o==="bilinear"?1:0,this.cropHeightBiggerThan1=this.outputShape[1]>1,this.cropWidthBiggerThan1=this.outputShape[2]>1,this.shaderKey=`cropAndResize_${this.methodId}_${this.cropHeightBiggerThan1}_${this.cropWidthBiggerThan1}`}getUserCode(){const[t,e]=["f32(uniforms.imageShape[1] - 1)","f32(uniforms.imageShape[2] - 1)"],[i,o,r]=this.cropHeightBiggerThan1?[`(${t} / f32(uniforms.outShape[1] - 1))`,"(y2-y1) * height_ratio",`y1*${t} + f32(y)*(height_scale)`]:["0.0","0.0",`0.5 * (y1+y2) * ${t}`],[n,a,u]=this.cropWidthBiggerThan1?[`(${e} / f32(uniforms.outShape[2] - 1))`,"(x2-x1) * width_ratio",`x1*${e} + f32(x)*(width_scale)`]:["0.0","0.0",`0.5 * (x1+x2) * ${e}`];return`
    ${y("index")} {
      if (index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        let height_ratio = f32(${i});
        let width_ratio = f32(${n});
        let b = coords[0];
        let y = coords[1];
        let x = coords[2];
        let d = coords[3];
        // get box vals
        let y1 = getBoxes(b, 0);
        let x1 = getBoxes(b, 1);
        let y2 = getBoxes(b, 2);
        let x2 = getBoxes(b, 3);
        // get image in batch index
        let bInd = i32(round(getBoxInd(b)));
        if(bInd < 0 || bInd >= uniforms.outShape[0]) {
          return;
        }
        let height_scale = ${o};
        let width_scale = ${a};
        let in_y = ${r};
        if( in_y < 0.0 || in_y > ${t} ) {
          setOutputAtIndex(index, uniforms.extrapolationValue);
          return;
        }
        let in_x = ${u};
        if( in_x < 0.0 || in_x > ${e} ) {
          setOutputAtIndex(index, uniforms.extrapolationValue);
          return;
        }
        let sourceFracIndexCR = vec2<f32>(in_x,in_y);
        if(${this.methodId} == 1) {
          // Compute the four integer indices.
          let sourceFloorCR = vec2<i32>(sourceFracIndexCR);
          let sourceCeilCR = vec2<i32>(ceil(sourceFracIndexCR));
          let topLeft = getImage(bInd, sourceFloorCR.y, sourceFloorCR.x, d);
          let bottomLeft = getImage(bInd, sourceCeilCR.y, sourceFloorCR.x, d);
          let topRight = getImage(bInd, sourceFloorCR.y, sourceCeilCR.x, d);
          let bottomRight = getImage(bInd, sourceCeilCR.y, sourceCeilCR.x, d);
          let fracCR = sourceFracIndexCR - vec2<f32>(sourceFloorCR);
          let top = topLeft + (topRight - topLeft) * fracCR.x;
          let bottom = bottomLeft + (bottomRight - bottomLeft) * fracCR.x;
          let newValue = top + (bottom - top) * fracCR.y;
          setOutputAtIndex(index, newValue);
        } else {
          // Compute the coordinators of nearest neighbor point.
          let sourceNearestCR = vec2<i32>(floor(
            sourceFracIndexCR + vec2<f32>(0.5,0.5)));
          let newValue = getImage(
            bInd, sourceNearestCR.y, sourceNearestCR.x, d);
          setOutputAtIndex(index, newValue);
        }
      }
    }
    `}}const Jn=s=>{const{inputs:t,backend:e,attrs:i}=s,{image:o,boxes:r,boxInd:n}=t,{cropSize:a,method:u,extrapolationValue:l}=i,c=new Zn(o.shape[3],r.shape,a,u),h=[{type:"float32",data:[l]}];return e.runWebGPUProgram(c,[o,r,n],"float32",h)},ea={kernelName:d.CropAndResize,backendName:"webgpu",kernelFunc:Jn};var ge;(function(s){s.Prod="*",s.Sum="+"})(ge||(ge={}));class ht{constructor(t,e,i,o){this.variableNames=["x"],this.uniforms="index : f32,",this.size=!0,this.workgroupSize=[128,1,1],this.outputShape=e,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.exclusive=i,this.reverse=o,this.op=t,this.shaderKey=`cum_${this.op}_${this.exclusive}_${this.reverse}`}getUserCode(){const t=this.outputShape.length,e=this.op===ge.Prod?"1.0":"0.0",i=this.exclusive?e:`getX(${pt(t,"coords",this.op)})`,o=this.outputShape[this.outputShape.length-1];let r="",n="";return this.exclusive?(r=this.reverse?`end != ${o-1}`:"end != 0",n=this.reverse?"end + 1":"end - 1"):(r=this.reverse?`end + pow2 < ${o}`:"end >= pow2",n=this.reverse?"end + pow2":"end - pow2"),`
      ${y("index")} {
       if (index < uniforms.size) {
         var coords = getCoordsFromIndex(index);

         let end = ${mt(t,"coords",this.op)};
         var val = ${i};
         let pow2 = i32(pow(2.0, uniforms.index));
         if (${r}) {
           let idx = ${n};
           ${mt(t,"coords",this.op)} = idx;
           val ${this.op}= getX(${pt(t,"coords",this.op)});
         }
         setOutputAtIndex(index, val);
       }
      }
    `}}function pt(s,t,e){if(s===1)return`${t}`;if(s===2)return`${t}.x, ${t}.y`;if(s===3)return`${t}.x, ${t}.y, ${t}.z`;if(s===4)return`${t}.x, ${t}.y, ${t}.z, ${t}.w`;throw Error(`Cumulative ${e} for rank ${s} is not yet supported`)}function mt(s,t,e){if(s===1)return`${t}`;if(s===2)return`${t}.y`;if(s===3)return`${t}.z`;if(s===4)return`${t}.w`;throw Error(`Cumulative ${e} for rank ${s} is not yet supported`)}function ft(s,t,e,i,o,r){const n=t.shape.length,a=d.backend_util.getAxesPermutation([i],n);let u=t;a!=null&&(u=Y({inputs:{x:t},backend:e,attrs:{perm:a}}));const l=d.backend_util.getInnerMostAxes(1,n)[0];if(l!==n-1)throw new Error(`WebGPU cumprod shader expects an inner-most axis=${t.shape.length-1} but got axis=${i}`);const c=u.shape[l];let h=H({inputs:{x:u},backend:e});for(let p=0;p<=Math.ceil(Math.log2(c))-1;p++){const m=new ht(s,u.shape,!1,r),f=h,g=[{type:"float32",data:[p]}];h=e.runWebGPUProgram(m,[h],h.dtype,g),e.disposeData(f.dataId)}if(o){const p=new ht(s,u.shape,o,r),m=h,f=[{type:"float32",data:[0]}];h=e.runWebGPUProgram(p,[h],h.dtype,f),e.disposeData(m.dataId)}if(a!=null){const p=d.backend_util.getUndoAxesPermutation(a),m=Y({inputs:{x:h},backend:e,attrs:{perm:p}});return e.disposeData(h.dataId),e.disposeData(u.dataId),m}return h}function ta(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{axis:r,exclusive:n,reverse:a}=i;return ft(ge.Prod,o,e,r,n,a)}const sa={kernelName:d.Cumprod,backendName:"webgpu",kernelFunc:ta};function oa(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{axis:r,exclusive:n,reverse:a}=i;return ft(ge.Sum,o,e,r,n,a)}const ia={kernelName:d.Cumsum,backendName:"webgpu",kernelFunc:oa};function ra(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,weights:r}=t,{size:n,binaryOutput:a}=i,u=o.shape.length===1,c=d.util.sizeFromShape(r.shape)>0,h=r.dtype,p=u?[o.shape[0]]:[o.shape[0],o.shape[1]],m=u?[n]:[o.shape[0],n],f=G({backend:e,attrs:{shape:m,value:0,dtype:h}}),g=new at(p,c,a),x=[{type:"int32",data:[n]}],C=c?[o,r]:[o];return e.runWebGPUProgram(g,C,h,x,f)}const na={kernelName:d.DenseBincount,backendName:"webgpu",kernelFunc:ra};class aa{constructor(t,e){this.variableNames=["x"],this.workgroupSize=[64,1,1],this.size=!0,this.uniforms="blockSize : i32,",this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey=`depthToSpace_${e}`,this.dataFormat=e}getUserCode(){return`
      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getCoordsFromIndex(index);
          let b = coords[0];
          let h = ${this.getHeightCoordString()};
          let w = ${this.getWidthCoordString()};
          let d = ${this.getDepthCoordString()};

          let in_h = h / uniforms.blockSize;
          let offset_h = h % uniforms.blockSize;
          let in_w = w / uniforms.blockSize;
          let offset_w = w % uniforms.blockSize;
          let offset_d = (offset_h * uniforms.blockSize + offset_w) *
            ${this.getOutputDepthSize()};
          let in_d = d + offset_d;

          let rlt = ${this.getInputSamplingString()};
          setOutputAtIndex(index, rlt);
        }
      }`}getHeightCoordString(){return this.dataFormat==="NHWC"?"coords[1]":"coords[2]"}getWidthCoordString(){return this.dataFormat==="NHWC"?"coords[2]":"coords[3]"}getDepthCoordString(){return this.dataFormat==="NHWC"?"coords[3]":"coords[1]"}getOutputDepthSize(){return this.dataFormat==="NHWC"?"uniforms.outShape[3]":"uniforms.outShape[1]"}getInputSamplingString(){return this.dataFormat==="NHWC"?"getX(b, in_h, in_w, in_d)":"getX(b, in_d, in_h, in_w)"}}function ua(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{blockSize:r,dataFormat:n}=i,a=o.shape[0],u=n==="NHWC"?o.shape[1]:o.shape[2],l=n==="NHWC"?o.shape[2]:o.shape[3],c=n==="NHWC"?o.shape[3]:o.shape[1],h=u*r,p=l*r,m=c/(r*r),f=n==="NHWC"?[a,h,p,m]:[a,m,h,p],g=[{type:"int32",data:[r]}],x=new aa(f,n);return e.runWebGPUProgram(x,[o],o.dtype,g)}const da={kernelName:d.DepthToSpace,backendName:"webgpu",kernelFunc:ua};class la{constructor(t,e,i,o=!1,r=null,n=!1){this.variableNames=["x","W"],this.uniforms="pads : vec2<i32>, inDims : vec2<i32>,",this.workgroupSize=[16,16,1],this.outputShape=t,this.dispatchLayout={x:[3],y:[2],z:[0,1]},this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),o&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),this.addBias=o,this.activation=r,this.hasPreluActivation=n,this.filterHeight=e,this.filterWidth=i,this.shaderKey=`depthwiseNCHW_${this.activation}_${this.filterHeight}_${this.filterWidth}`}getUserCode(){const t=this.filterWidth*this.filterHeight,e=this.workgroupSize[0]*this.workgroupSize[1]*this.workgroupSize[2],i=this.workgroupSize[1]+this.filterHeight-1,o=this.workgroupSize[0]+this.filterWidth-1;return`
      ${Q(this.activation,this.hasPreluActivation,!1,4)}

      var<workgroup> mm_Asub : array<array<f32, ${o}>, ${i}>;
      var<workgroup> mm_Bsub : array<array<f32, ${this.filterWidth}>, ${this.filterHeight}>;
      fn readX(batch : i32, channel : i32, row : i32, col : i32) -> f32 {
        var value = 0.0;
        if (row >=0 && row < uniforms.inDims[0] && col >=0 && col < uniforms.inDims[1])
        {
          value = getX(batch, channel, row, col);
        }
        return value;
      }

      ${y()} {
        let coords = getOutputCoords();
        let batch = coords[0];
        let xRCCorner = vec2<i32>(coords.zw) - uniforms.pads;
        let channelMul = uniforms.wShape[3];
        let d1 = coords[1] / channelMul;
        let q = coords[1] % channelMul;

        let inputRowStart = xRCCorner.x;
        let inputColStart = xRCCorner.y;

        let localRow = i32(localId.y);
        let localCol = i32(localId.x);

        // Load one tile of X into local memory.
        for (var inputRow = localRow; inputRow < ${i}; inputRow = inputRow + ${this.workgroupSize[1]}) {
          for (var inputCol = localCol; inputCol < ${o}; inputCol = inputCol + ${this.workgroupSize[0]}) {
            let rowOffset = inputRow - localRow;
            let colOffset = inputCol - localCol;
            mm_Asub[inputRow][inputCol] = readX(batch, d1, inputRowStart + rowOffset, inputColStart + colOffset);
          }
        }

        // Load one tile of W into local memory.
        var wIndex = i32(localIndex);
        ${t<e?`if (wIndex < ${t})`:`for(; wIndex < ${t}; wIndex = wIndex + ${e})`}

        {
          let wRow = wIndex / ${this.filterWidth};
          let wCol = wIndex % ${this.filterWidth};
          mm_Bsub[wRow][wCol] = getW(wRow, wCol, d1, q);
        }

        workgroupBarrier();

        var value = 0.0;
        for (var wR = 0; wR < ${this.filterHeight}; wR = wR + 1) {
          for (var wC = 0; wC < ${this.filterWidth}; wC = wC + 1) {
            let xVal = mm_Asub[localRow + wR][localCol + wC];
            let wVal = mm_Bsub[wR][wC];
            value = fma(xVal, wVal, value);
          }
        }
        ${se(this.addBias,this.activation)}
        if (coordsInBounds4D(coords, uniforms.outShape)) {
          setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
        }
      }
    `}}class gt{constructor(t,e=!1,i=null,o=!1){this.variableNames=["x","W"],this.uniforms="pads : vec2<i32>, inDims : vec2<i32>, virtualWidth : i32,",this.workgroupSize=[64,1,1],this.workPerThread=4,this.outputComponent=4,this.outputShape=t.outShape,this.virtualWidth=Math.ceil(this.outputShape[2]/this.workPerThread)*this.workPerThread;const r=[this.outputShape[0],this.outputShape[1],this.virtualWidth,this.outputShape[3]];this.dispatchLayout=R(r),this.dispatch=v(this.dispatchLayout,r,this.workgroupSize,[this.outputComponent*this.workPerThread,1,1]),d.util.assert(t.dataFormat==="channelsLast",()=>"TODO: NCHW is unimplemented"),e&&this.variableNames.push("bias"),o&&this.variableNames.push("preluActivationWeights"),this.convInfo=t,this.addBias=e,this.activation=i,this.hasPreluActivation=o,this.shaderKey=`depthwiseVec4_${i}_${this.convInfo.filterHeight}_${this.convInfo.filterWidth}_${this.convInfo.strideHeight}_${this.convInfo.strideWidth}_${this.workPerThread}`}getUserCode(){const t=(this.workPerThread-1)*this.convInfo.strideWidth+this.convInfo.filterWidth,e=this.convInfo.strideHeight,i=this.convInfo.strideWidth;return`
      ${Q(this.activation,this.hasPreluActivation,!0,4)}
      fn readX(batch : i32, row : i32, col : i32, channel : i32) -> vec4<f32> {
        var value = vec4<f32>(0.0);
        if (col >=0 && col < uniforms.inDims[1]) {
          value = getX(batch, row, col, channel);
        }
        return value;
      }

      ${y("index")} {
        let width0 = uniforms.outShape[3] / ${this.outputComponent};
        let d1 = (index % width0) * ${this.outputComponent};
        var index1 = index / width0;
        let width1 = uniforms.virtualWidth / ${this.workPerThread};
        let c = (index1 % width1) * ${this.workPerThread};
        index1 = index1 / width1;
        let r = index1 % uniforms.outShape[1];
        let batch = index1 / uniforms.outShape[1];

        let xRCCorner = vec2<i32>(r, c) * vec2<i32>(${e}, ${i}) - uniforms.pads;

        let xRCorner = xRCCorner.x;
        let xCCorner = xRCCorner.y;
        var xVals : array<vec4<f32>, ${t}>;
        var dotProd : array<vec4<f32>, ${this.workPerThread}>;
        for (var i = 0; i < ${this.workPerThread}; i++) {
          dotProd[i] = vec4<f32>(0.0);
        }

        // Use constant instead of uniform can give better performance.
        for (var wR = 0; wR < ${this.convInfo.filterHeight}; wR = wR + 1) {
          let xR = xRCorner + wR;
          if (xR >=0 && xR < uniforms.inDims[0]) {
            for (var i = 0; i < ${t}; i++) {
              xVals[i] = readX(batch, xR, xCCorner + i, d1);
            }
            for (var wC = 0; wC < ${this.convInfo.filterWidth}; wC = wC + 1) {
              let wValue = getW(wR, wC, d1, 0);
              for (var i = 0; i < ${this.workPerThread}; i++) {
                dotProd[i] = fma(xVals[i * ${i} + wC], wValue, dotProd[i]);
              }
            }
          }
        }

        for (var i = 0; i < ${this.workPerThread}; i = i + 1) {
          let coords = vec4<i32>(batch, r, c + i, d1);
          if (coordsInBounds4D(coords, uniforms.outShape)) {
            var value = dotProd[i];
            ${se(this.addBias,this.activation)}
            setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
          }
        }
      }
    `}}class xt{constructor(t,e=!1,i=null,o=!1){this.variableNames=["x","W"],this.uniforms=`pads : vec2<i32>, inDims : vec2<i32>, filterHeight : i32,
      filterWidth : i32, strides : vec2<i32>, dilations : vec2<i32>,`,this.workgroupSize=[256,1,1],this.size=!0,this.outputShape=t.outShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.isChannelsLast=t.dataFormat==="channelsLast",e&&this.variableNames.push("bias"),o&&this.variableNames.push("preluActivationWeights"),this.convInfo=t,this.addBias=e,this.activation=i,this.hasPreluActivation=o,this.shaderKey=`depthwise_${this.activation}_${this.isChannelsLast}`}getUserCode(){const t=this.isChannelsLast?"getX(batch, xR, xC, d1);":"getX(batch, d1, xR, xC);";return`
      ${Q(this.activation,this.hasPreluActivation,!1,4)}

      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getOutputCoords();
          let batch = coords[0];
          let xRCCorner = vec2<i32>(coords.${this.isChannelsLast?"yz":"zw"}) * uniforms.strides - uniforms.pads;
          let d2 = coords[${this.isChannelsLast?3:1}];
          let channelMul = uniforms.wShape[3];
          let d1 = d2 / channelMul;
          let q = d2 % channelMul;

          let inputRowStart = xRCCorner.x;
          let inputColStart = xRCCorner.y;
          let inputRowEnd = inputRowStart + uniforms.filterHeight *
              uniforms.dilations[0];
          let inputColEnd = inputColStart + uniforms.filterWidth *
              uniforms.dilations[1];

          // Convolve x(?, ?, d1)|x(d1, ?, ?) with w(:, :, d1, q) to get
          // y(yR, yC, d2)|y(d2, yR, yC). ? = to be determined. : = across all
          // values in that axis. x(?, ?, d1) and y(yR, yC, d2) is for NHWC.
          // x(d1, ?, ?) and y(d2, yR, yC) is for NCHW.
          var value = 0.0;

          // Extract if checking out of for loop for performance.
          if (inputRowStart >= 0 && inputColStart >= 0 &&
            inputRowEnd < uniforms.inDims[0] &&
                inputColEnd < uniforms.inDims[1]) {
              for (var wR = 0; wR < uniforms.filterHeight; wR = wR + 1) {
                let xR = inputRowStart + wR * uniforms.dilations[0];

                for (var wC = 0; wC < uniforms.filterWidth; wC = wC + 1) {
                  let xC = inputColStart + wC * uniforms.dilations[1];

                  let xVal = ${t};
                  let wVal = getW(wR, wC, d1, q);
                  value = value + xVal * wVal;
                }
              }
            } else {
              for (var wR = 0; wR < uniforms.filterHeight; wR = wR + 1) {
                let xR = inputRowStart + wR * uniforms.dilations[0];

                if (xR < 0 || xR >= uniforms.inDims[0]) {
                  continue;
                }

                for (var wC = 0; wC < uniforms.filterWidth; wC = wC + 1) {
                  let xC = inputColStart + wC * uniforms.dilations[1];

                  if (xC < 0 || xC >= uniforms.inDims[1]) {
                    continue;
                  }

                  let xVal = ${t};
                  let wVal = getW(wR, wC, d1, q);
                  value = value + xVal * wVal;
                }
              }
            }
            ${se(this.addBias,this.activation)}
          setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
        }
      }
    `}}function ca(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,filter:r}=t,{strides:n,pad:a,dataFormat:u,dilations:l,dimRoundingMode:c}=i,h=d.backend_util.convertConv2DDataFormat(u);let p=l;p==null&&(p=[1,1]);const m=d.backend_util.computeConv2DInfo(o.shape,r.shape,n,p,a,c,!0,h),f=[{type:"int32",data:[m.padInfo.top,m.padInfo.left]},{type:"int32",data:[m.inHeight,m.inWidth]}],g=m.dataFormat==="channelsLast";let x;return!g&&m.inHeight>16&&m.inWidth>16&&m.strideHeight===1&&m.strideWidth===1&&m.dilationWidth===1&&m.dilationHeight===1&&m.inChannels===m.outChannels?x=new la(m.outShape,m.filterHeight,m.filterWidth):g&&m.outHeight>4&&m.outWidth>4&&m.strideWidth<=2&&m.inChannels===m.outChannels&&m.dilationHeight===1&&m.dilationWidth===1&&m.inChannels%4===0?(x=new gt(m),f.push({type:"int32",data:[x.virtualWidth]})):(x=new xt(m),f.push({type:"int32",data:[m.filterHeight]},{type:"int32",data:[m.filterWidth]},{type:"int32",data:[m.strideHeight,m.strideWidth]},{type:"int32",data:[m.dilationHeight,m.dilationWidth]})),e.runWebGPUProgram(x,[o,r],o.dtype,f)}const ha={kernelName:d.DepthwiseConv2dNative,backendName:"webgpu",kernelFunc:ca};class pa{constructor(t){this.variableNames=["x","dy"],this.uniforms=`strides : vec2<i32>, pads : vec2<i32>, filterDims : vec2<i32>, outHeight : i32,
      outWidth : i32, inHeight : i32, inWidth : i32, batchSize : i32, channelMul : i32,`,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.filterShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="depthwise_conv2d_backprop_filter"}getUserCode(){return`
      ${y("index")} {
      if (index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        let wR = coords[0];
        let wC = coords[1];
        let d1 = coords[2];
        let dm = coords[3];
        let d2 = d1 * uniforms.channelMul + dm;

        var dotProd = 0.0;
        for (var b = 0; b < uniforms.batchSize; b++) {
          for (var yR = 0; yR < uniforms.outHeight; yR++) {
            let xR = wR + yR * uniforms.strides[0] - uniforms.pads[0];

            if (xR < 0 || xR >= uniforms.inHeight) {
              continue;
            }

            for (var yC = 0; yC < uniforms.outWidth; yC++) {
              let xC = wC + yC * uniforms.strides[1] - uniforms.pads[1];

              if (xC < 0 || xC >= uniforms.inWidth) {
                continue;
              }

              let dyValue = getDy(b, yR, yC, d2);
              let xValue = getX(b, xR, xC, d1);
              dotProd += xValue * dyValue;
            }
          }
        }
        setOutputAtIndex(index, dotProd);
      }
    }
    `}}class ma{constructor(t){this.variableNames=["dy","W"],this.uniforms=`strides : vec2<i32>, pads : vec2<i32>, filterDims : vec2<i32>,
       outHeight : i32, outWidth : i32, channelMul : i32,`,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.inShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="depthwise_conv2d_backprop_input"}getUserCode(){return`
      ${y("index")} {
      if (index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        let batch = coords[0];
        let d1 = coords[3];
        let dyCorner = coords.yz - uniforms.pads;
        let dyRCorner = dyCorner.x;
        let dyCCorner = dyCorner.y;

        var dotProd = 0.0;
        for (var wR = 0; wR < uniforms.filterDims[0]; wR++) {
          let dyR = f32(dyRCorner + wR) / f32(uniforms.strides[0]);

          if (dyR < 0.0 || dyR >= f32(uniforms.outHeight) || fract(dyR) > 0.0) {
            continue;
          }

          let idyR = i32(dyR);
          let wRPerm = uniforms.filterDims[0] - 1 - wR;

          for (var wC = 0; wC < uniforms.filterDims[1]; wC++) {
            let dyC = f32(dyCCorner + wC) / f32(uniforms.strides[1]);

            if (dyC < 0.0 || dyC >= f32(uniforms.outWidth) || fract(dyC) > 0.0) {
              continue;
            }

            let idyC = i32(dyC);
            let wCPerm = uniforms.filterDims[1] - 1 - wC;

            for (var dm = 0; dm < uniforms.channelMul; dm++) {
              let d2 = d1 * uniforms.channelMul + dm;
              let xValue = getDy(batch, idyR, idyC, d2);
              let wValue = getW(wRPerm, wCPerm, d1, dm);
              dotProd += xValue * wValue;
            }
          }
        }
        setOutputAtIndex(index, dotProd);
      }
    }
    `}}function fa(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,dy:r}=t,{strides:n,dilations:a,pad:u,dimRoundingMode:l,filterShape:c}=i,h=d.backend_util.computeConv2DInfo(o.shape,c,n,a,u,l,!0),p=new pa(h),m=[{type:"int32",data:[h.strideHeight,h.strideWidth]},{type:"int32",data:[h.padInfo.top,h.padInfo.left]},{type:"int32",data:[h.filterHeight,h.filterWidth]},{type:"int32",data:[h.outHeight]},{type:"int32",data:[h.outWidth]},{type:"int32",data:[h.inHeight]},{type:"int32",data:[h.inWidth]},{type:"int32",data:[h.batchSize]},{type:"int32",data:[h.outChannels/h.inChannels]}];return e.runWebGPUProgram(p,[o,r],"float32",m)}const ga={kernelName:d.DepthwiseConv2dNativeBackpropFilter,backendName:"webgpu",kernelFunc:fa};function xa(s){const{inputs:t,backend:e,attrs:i}=s,{dy:o,filter:r}=t,{strides:n,dilations:a,pad:u,dimRoundingMode:l,inputShape:c}=i,h=d.backend_util.computeConv2DInfo(c,r.shape,n,a,u,l,!0),p=new ma(h),m=[{type:"int32",data:[h.strideHeight,h.strideWidth]},{type:"int32",data:[h.filterHeight-1-h.padInfo.top,h.filterWidth-1-h.padInfo.left]},{type:"int32",data:[h.filterHeight,h.filterWidth]},{type:"int32",data:[h.outHeight]},{type:"int32",data:[h.outWidth]},{type:"int32",data:[h.outChannels/h.inChannels]}];return e.runWebGPUProgram(p,[o,r],o.dtype,m)}const Ca={kernelName:d.DepthwiseConv2dNativeBackpropInput,backendName:"webgpu",kernelFunc:xa};class ba{constructor(t){this.variableNames=["x"],this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=[t,t],this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="diag"}getUserCode(){return`
      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getOutputCoords();
          let value = select(0.0, getX(coords[0]), coords[0] == coords[1]);
          setOutputAtIndex(index, value);
        }
      }
    `}}function wa(s){const{inputs:t,backend:e}=s,{x:i}=t,o=[...i.shape,...i.shape],r=d.util.sizeFromShape(i.shape),n=P({inputs:{x:i},backend:e,attrs:{shape:[r]}}),a=new ba(r),u=e.runWebGPUProgram(a,[n],n.dtype),l=P({inputs:{x:u},backend:e,attrs:{shape:o}});return e.disposeData(n.dataId),e.disposeData(u.dataId),l}const Sa={kernelName:d.Diag,backendName:"webgpu",kernelFunc:wa};class ya{constructor(t){this.variableNames=["x","w"],this.uniforms="filterDims: vec2<i32>, pads: vec2<i32>, strides: vec2<i32>, dilations: vec2<i32>",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.outShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="dilation2d"}getUserCode(){return`
       ${y("index")} {
         if (index < uniforms.size) {
           let neg_infinity = -3.4e38;
           let coords = getOutputCoords();
           let batch = coords.x;
           let d1 = coords.w;
           let outTopLeftCorner = coords.yz * uniforms.strides - uniforms.pads;
           let hBeg = outTopLeftCorner.x;
           let wBeg = outTopLeftCorner.y;

           var curVal = neg_infinity;
           for (var h = 0; h < uniforms.filterDims[0]; h = h + 1) {
             let hIn = hBeg + h * uniforms.dilations[0];

             if (hIn >= 0 && hIn < uniforms.xShape[1]) {
               for (var w = 0; w < uniforms.filterDims[1]; w = w + 1) {
                 let wIn = wBeg + w * uniforms.dilations[1];

                 if (wIn >= 0 && wIn < uniforms.xShape[2]) {
                   let val = getX(batch, hIn, wIn, d1) + getW(h, w, d1);
                   if (val > curVal) {
                     curVal = val;
                   }
                 }
               }
             }
           }

           setOutputAtIndex(index, curVal);
         }
       }
     `}}function va(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,filter:r}=t,{strides:n,pad:a,dilations:u}=i,l=d.backend_util.computeDilation2DInfo(o.shape,r.shape,n,a,"NHWC",u),c=[l.padInfo.top,l.padInfo.left],h=[{type:"int32",data:[l.filterHeight,l.filterWidth]},{type:"int32",data:[...c]},{type:"int32",data:[l.strideHeight,l.strideWidth]},{type:"int32",data:[l.dilationHeight,l.dilationWidth]}],p=new ya(l);return e.runWebGPUProgram(p,[o,r],o.dtype,h)}const Ia={kernelName:d.Dilation2D,backendName:"webgpu",kernelFunc:va};class ka{constructor(t,e){if(this.variableNames=["x","w","dy"],this.uniforms="filterDims: vec2<i32>, pads: vec2<i32>, strides: vec2<i32>, dilations: vec2<i32>, dySize: i32,",this.workgroupSize=[64,1,1],this.atomic=!0,this.outputShape=t.inShape,this.dispatchLayout=R(t.outShape),this.dispatch=v(this.dispatchLayout,t.outShape,this.workgroupSize),e!=="float32"&&e!=="int32")throw new Error(`Dilation2DBackpropInput only supports float32 and int32
          types, does not support ${e} type.`);this.type=e,this.shaderKey="dilation2DBackpropInput"}getUserCode(){return`
       ${y("index")} {
         if (index < uniforms.dySize) {
           let coords = getDyCoordsFromIndex(index);
           let b = coords[0];
           let r = coords[1];
           let c = coords[2];
           let d = coords[3];

           let dyCorner = vec2<i32>(r, c) * uniforms.strides - uniforms.pads;
           var curVal = -3.4e38;  // neg_infinity
           var xRMax = 0;
           var xCMax = 0;

           // In the case of multiple argmax branches, we only back-propagate
           // along the last branch, i.e., the one with largest value of
           // 'wR * uniforms.filterDims[1] + wC', similarly to the max-pooling
           // backward routines.
           for (var wR = 0; wR < uniforms.filterDims[0]; wR++) {
             let xR = dyCorner.x + wR * uniforms.dilations[0];

             if (xR >= 0 && xR < uniforms.xShape[1]) {
               for (var wC = 0; wC < uniforms.filterDims[1]; wC++) {
                 let xC = dyCorner.y + wC * uniforms.dilations[1];

                 if (xC >= 0 && xC < uniforms.xShape[2]) {
                   let val = getX(b, xR, xC, d) + getW(wR, wC, d);
                   if (val > curVal) {
                     curVal = val;
                     xRMax = xR;
                     xCMax = xC;
                   }
                 }
               }
             }
           }

           let flatIndexIn = d + uniforms.xShape[3] *
               (xCMax + uniforms.xShape[2] * (xRMax + uniforms.xShape[1] * b));
           let value = getDy(b, r, c, d);
           ${Z("&result[flatIndexIn]","value",this.type)}
         }
       }
     `}}class Ra{constructor(t,e,i){if(this.variableNames=["x","w","dy"],this.uniforms="filterDims: vec2<i32>, pads: vec2<i32>, strides: vec2<i32>, dilations: vec2<i32>, dySize: i32,",this.workgroupSize=[64,1,1],this.atomic=!0,this.outputShape=t.filterShape,this.dispatchLayout=R(t.outShape),this.dispatch=v(this.dispatchLayout,t.outShape,this.workgroupSize),i!=="float32"&&i!=="int32")throw new Error(`Dilation2DBackpropFilter only supports float32 and int32
          types, does not support ${i} type.`);this.type=i,this.shaderKey="dilation2DBackpropFilter"}getUserCode(){return`
       ${y("index")} {
         if (index < uniforms.dySize) {
           let coords = getDyCoordsFromIndex(index);
           let b = coords[0];
           let r = coords[1];
           let c = coords[2];
           let d = coords[3];

           let dyCorner = vec2<i32>(r, c) * uniforms.strides - uniforms.pads;
           var curVal = -3.4e38;  // neg_infinity
           var wRMax = 0;
           var wCMax = 0;

           // In the case of multiple argmax branches, we only back-propagate
           // along the last branch, i.e., the one with largest value of
           // 'wR * uniforms.filterDims[1] + wC', similarly to the max-pooling
           // backward routines.
           for (var wR = 0; wR < uniforms.filterDims[0]; wR++) {
             let xR = dyCorner.x + wR * uniforms.dilations[0];

             if (xR >= 0 && xR < uniforms.xShape[1]) {
               for (var wC = 0; wC < uniforms.filterDims[1]; wC++) {
                 let xC = dyCorner.y + wC * uniforms.dilations[1];

                 if (xC >= 0 && xC < uniforms.xShape[2]) {
                   let val = getX(b, xR, xC, d) + getW(wR, wC, d);
                   if (val > curVal) {
                     curVal = val;
                     wRMax = wR;
                     wCMax = wC;
                   }
                 }
               }
             }
           }

           let flatIndexIn = d + uniforms.wShape[2] * (wCMax + wRMax * uniforms.wShape[1]);
           let value = getDy(b, r, c, d);
           ${Z("&result[flatIndexIn]","value",this.type)}
         }
       }
     `}}function Pa(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,filter:r,dy:n}=t,{strides:a,pad:u,dilations:l}=i,c=d.backend_util.computeDilation2DInfo(o.shape,r.shape,a,u,"NHWC",l),h=r.dtype,p=new Ra(c,r.shape,h),m=[{type:"int32",data:[c.filterHeight,c.filterWidth]},{type:"int32",data:[c.padInfo.top,c.padInfo.left]},{type:"int32",data:[c.strideHeight,c.strideWidth]},{type:"int32",data:[c.dilationHeight,c.dilationWidth]},{type:"int32",data:[d.util.sizeFromShape(c.outShape)]}],f=G({backend:e,attrs:{shape:r.shape,value:0,dtype:h}});return e.runWebGPUProgram(p,[o,r,n],h,m,f)}const $a={kernelName:d.Dilation2DBackpropFilter,backendName:"webgpu",kernelFunc:Pa};function Da(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,filter:r,dy:n}=t,{strides:a,pad:u,dilations:l}=i,c=d.backend_util.computeDilation2DInfo(o.shape,r.shape,a,u,"NHWC",l),h=o.dtype,p=new ka(c,h),m=[{type:"int32",data:[c.filterHeight,c.filterWidth]},{type:"int32",data:[c.padInfo.top,c.padInfo.left]},{type:"int32",data:[c.strideHeight,c.strideWidth]},{type:"int32",data:[c.dilationHeight,c.dilationWidth]},{type:"int32",data:[d.util.sizeFromShape(c.outShape)]}],f=G({backend:e,attrs:{shape:c.inShape,value:0,dtype:h}});return e.runWebGPUProgram(p,[o,r,n],h,m,f)}const Na={kernelName:d.Dilation2DBackpropInput,backendName:"webgpu",kernelFunc:Da};class za{constructor(t,e,i){this.variableNames=["Image"],this.uniforms="alpha: f32,",this.workgroupSize=[64,1,1],this.pixelsOpType=re.DRAW,this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.type=e,this.textureFormat=i,this.shaderKey=`draw_${e}_${i}`}getUserCode(){let t;const e=this.type==="float32"?"value":"value / 255.0";return t=`
      if (uniforms.numChannels == 1) {
        rgba[0] = ${e};
        rgba[1] = ${e};
        rgba[2] = ${e};
      } else {
        rgba[d] = ${e};
      }`,`
       @group(0) @binding(0) var outImage : texture_storage_2d<${this.textureFormat}, write>;
       ${y("index")} {
         if (index < uniforms.size) {
           var rgba = vec4<f32>(0.0, 0.0, 0.0, uniforms.alpha);
           for (var d = 0; d < uniforms.numChannels; d = d + 1) {
             let value = f32(inBuf[index * uniforms.numChannels + d]);
             ${t}
           }
           rgba.x = rgba.x * rgba.w;
           rgba.y = rgba.y * rgba.w;
           rgba.z = rgba.z * rgba.w;
           let coords = getCoordsFromIndex(index);
           textureStore(outImage, vec2<i32>(coords.yx), rgba);
         }
       }
      `}}function Aa(s){const{inputs:t,backend:e,attrs:i}=s,{image:o}=t,{canvas:r,options:n}=i,[a,u]=o.shape.slice(0,2),{imageOptions:l}=n||{},c=l?.alpha||1,h=e.device.features.has("bgra8unorm-storage")?"bgra8unorm":"rgba8unorm",p=[a,u],m=new za(p,o.dtype,h);r.width=u,r.height=a;const f="webgpu";let g=r.getContext(f),x;g||(x=new OffscreenCanvas(u,a),g=x.getContext(f));const C=o.shape.length===3?o.shape[2]:1;g.configure({device:e.device,format:h,usage:GPUTextureUsage.STORAGE_BINDING,alphaMode:"premultiplied"});const b="int32",w=e.makeTensorInfo(p,b),I=e.tensorMap.get(w.dataId);I.resource=g.getCurrentTexture(),I.external=!0;const k=[{type:"uint32",data:[C]},{type:"float32",data:[c]}];if(e.runWebGPUProgram(m,[o],b,k,w),x){const $=r.getContext("2d");if(!$)throw new Error("Please make sure this canvas has only been used for 2d or webgpu context!");$.drawImage(x,0,0)}return e.disposeData(w.dataId),o}const Fa={kernelName:d.Draw,backendName:"webgpu",kernelFunc:Aa};const Ct=W({opType:N.MUL,cpuKernelImpl:Ti,supportsComplex:!0}),_a={kernelName:d.Multiply,backendName:"webgpu",kernelFunc:Ct};function bt(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{axis:r,keepDims:n}=i;return ie(o,r,n,"sum",e)}const La={kernelName:d.Sum,backendName:"webgpu",kernelFunc:bt};function Ea(s){const{inputs:t,backend:e,attrs:i}=s,{equation:o}=i,r=t,{allDims:n,summedDims:a,idDims:u}=d.backend_util.decodeEinsumEquation(o,r.length);d.backend_util.checkEinsumDimSizes(n.length,u,r);const{path:l,steps:c}=d.backend_util.getEinsumComputePath(a,u),h=c.length;let p=null,m=n.length;const f=[];for(let g=0;g<h;++g){for(const x of c[g]){const{permutationIndices:C,expandDims:b}=d.backend_util.getEinsumPermutation(m,u[x]);let w;d.backend_util.isIdentityPermutation(C)?w=r[x]:(w=Y({inputs:{x:r[x]},backend:e,attrs:{perm:C}}),f.push(w));const I=w.shape.slice();for(let k=0;k<b.length;++k)I.splice(b[k],0,1);d.util.arraysEqual(w.shape,I)||(w=P({inputs:{x:w},backend:e,attrs:{shape:I}}),f.push(w)),p===null?p=w:(p=Ct({inputs:{a:w,b:p},backend:e}),f.push(p))}g<h-1&&(l[g]>=0&&(p=bt({inputs:{x:p},backend:e,attrs:{axis:l[g]-(n.length-m),keepDims:!1}}),f.push(p)),m--)}for(const g of f)g!==p&&e.disposeData(g.dataId);return p}const Ta={kernelName:d.Einsum,backendName:"webgpu",kernelFunc:Ea};const Ba=_({opType:S.ELU}),Wa={kernelName:d.Elu,backendName:"webgpu",kernelFunc:Ba};const Ma=s=>{const{inputs:t,backend:e}=s,{dy:i,y:o}=t,r=new ke(N.ELU_DER,i.shape,o.shape);return e.runWebGPUProgram(r,[i,o],i.dtype)},Va={kernelName:d.EluGrad,backendName:"webgpu",kernelFunc:Ma};const Ua=W({opType:N.EQUAL,dtype:"bool",cpuKernelImpl:yi}),Oa={kernelName:d.Equal,backendName:"webgpu",kernelFunc:Ua};const Ga=_({opType:S.ERF}),Ha={kernelName:d.Erf,backendName:"webgpu",kernelFunc:Ga};const Xa=_({opType:S.EXP,cpuKernelImpl:vi,dtype:"float32"}),Ka={kernelName:d.Exp,backendName:"webgpu",kernelFunc:Xa};function Me(s){const{inputs:t,attrs:e,backend:i}=s,{dim:o}=e,{input:r}=t,n=r.shape.length,a=r.shape.slice();let u=o;return o<0&&(d.util.assert(-(n+1)<=o,()=>`Axis must be in the interval [${-(n+1)}, ${n}]`),u=n+o+1),a.splice(u,0,1),P({inputs:{x:r},backend:i,attrs:{shape:a}})}const qa={kernelName:d.ExpandDims,backendName:"webgpu",kernelFunc:Me};const Ya=_({opType:S.EXPM1,cpuKernelImpl:Ii}),ja={kernelName:d.Expm1,backendName:"webgpu",kernelFunc:Ya};class wt{constructor(t,e){this.variableNames=["real","imag"],this.outputShape=[],this.uniforms="exponentMultiplier : f32, denominator: f32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=e,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.component=t,this.shaderKey=`fft_${t}`}getUserCode(){return`
    fn unaryOpComplex(real: f32, expR: f32, imag: f32, expI: f32) -> f32 {
      ${this.component==="real"?"return real * expR - imag * expI;":"return real * expI + imag * expR;"}
    }

    fn mulMatDFT(batch: i32, index: i32) -> f32 {
      let indexRatio = f32(index) / f32(uniforms.realShape[1]);
      let exponentMultiplierTimesIndexRatio =
          uniforms.exponentMultiplier * indexRatio;

      var result = 0.0;

      for (var i = 0; i < uniforms.realShape[1]; i = i + 1) {
        // x = (-2|2 * PI / N) * index * i;
        let x = exponentMultiplierTimesIndexRatio * f32(i);
        let expR = cos(x);
        let expI = sin(x);
        let real = getReal(batch, i);
        let imag = getImag(batch, i);

        result = result +
            unaryOpComplex(real, expR, imag, expI) / uniforms.denominator;
      }

      return result;
    }

    ${y("index")} {
      if (index < uniforms.size) {
        let coords = getOutputCoords();
        setOutputAtIndex(index, mulMatDFT(coords[0], coords[1]));
      }
    }
  `}}function St(s,t,e){const i=e.tensorMap.get(s.dataId),o=d.util.sizeFromShape(s.shape),r=s.shape[s.shape.length-1],n=o/r,a=[],u=P({inputs:{x:s},backend:e,attrs:{shape:[n,r]}});a.push(u);const l=u.shape,c=new wt("real",l),h=new wt("imag",l),p=[{dataId:i.complexTensorInfos.real.dataId,dtype:i.complexTensorInfos.real.dtype,shape:l},{dataId:i.complexTensorInfos.imag.dataId,dtype:i.complexTensorInfos.imag.dtype,shape:l}],m=t?2*Math.PI:-2*Math.PI,f=t?l[1]:1,g=[{type:"float32",data:[m]},{type:"float32",data:[f]}],x=e.runWebGPUProgram(c,p,"float32",g);a.push(x);const C=e.runWebGPUProgram(h,p,"float32",g);a.push(C);const b=oe({inputs:{real:x,imag:C},backend:e});a.push(b);const w=P({inputs:{x:b},backend:e,attrs:{shape:s.shape}});return a.forEach(I=>e.disposeData(I.dataId)),w}function Qa(s){const{inputs:t,backend:e}=s,{input:i}=t;return St(i,!1,e)}const Za={kernelName:d.FFT,backendName:"webgpu",kernelFunc:Qa};class Ja{constructor(t){this.outputShape=[],this.variableNames=["x"],this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="flipLeftRight"}getUserCode(){return`
      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getCoordsFromIndex(index);
          let coordX = uniforms.xShape[2] - coords[2] - 1;
          let outputValue = getX(coords[0], coords[1], coordX, coords[3]);
          setOutputAtIndex(index, outputValue);
        }
      }
    `}}const eu={kernelName:d.FlipLeftRight,backendName:"webgpu",kernelFunc:({inputs:s,backend:t})=>{const{image:e}=s,i=t,o=new Ja(e.shape);return i.runWebGPUProgram(o,[e],e.dtype)}};const tu=_({opType:S.FLOOR,cpuKernelImpl:ki}),su={kernelName:d.Floor,backendName:"webgpu",kernelFunc:tu};const ou=W({opType:N.FLOOR_DIV,cpuKernelImpl:Ri,dtype:"int32"}),iu={kernelName:d.FloorDiv,backendName:"webgpu",kernelFunc:ou};class ru{constructor(t,e,i=!1){this.pixelsOpType=re.FROM_PIXELS,this.outputShape=[0],this.variableNames=[],this.workgroupSize=[256,1,1],this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,[e,1,1]),this.importVideo=i,this.shaderKey=`fromPixels_${this.importVideo}`}getUserCode(){const t=this.importVideo?"textureLoad(src, vec2<i32>(coords.yx));":"textureLoad(src, vec2<i32>(coords.yx), 0)";return`
      @binding(1) @group(0) var src: ${this.importVideo?"texture_external":"texture_2d<f32>"};
      ${y("index")} {
        let flatIndex = index * uniforms.numChannels;
        if (flatIndex < uniforms.size) {
          let coords = getCoordsFromIndex(flatIndex);
          let values = ${t};
          for (var i = 0; i < uniforms.numChannels; i = i + 1) {
            result[flatIndex + i] = i32(floor(255.0 * values[i]));
          }
        }
      }
  `}}const nu={kernelName:d.FromPixels,backendName:"webgpu",kernelFunc:au};let de,Ve=d.env().getBool("CANVAS2D_WILL_READ_FREQUENTLY_FOR_GPU");function au(s){const{inputs:t,backend:e,attrs:i}=s;let{pixels:o}=t;const{numChannels:r}=i;if(o==null)throw new Error("pixels passed to tf.browser.fromPixels() can not be null");const n=typeof HTMLVideoElement<"u"&&o instanceof HTMLVideoElement,a=typeof HTMLImageElement<"u"&&o instanceof HTMLImageElement,u=typeof HTMLCanvasElement<"u"&&o instanceof HTMLCanvasElement||typeof OffscreenCanvas<"u"&&o instanceof OffscreenCanvas,l=typeof ImageBitmap<"u"&&o instanceof ImageBitmap,[c,h]=n?[o.videoWidth,o.videoHeight]:[o.width,o.height],p=[h,c,r],m=d.env().getBool("WEBGPU_IMPORT_EXTERNAL_TEXTURE")&&n,f=n||a;if(l||u||f){let b;if(m)b=e.device.importExternalTexture({source:o});else{if(f){const V=d.env().getBool("CANVAS2D_WILL_READ_FREQUENTLY_FOR_GPU");(de==null||V!==Ve)&&(Ve=V,de=document.createElement("canvas").getContext("2d",{willReadFrequently:Ve})),de.canvas.width=c,de.canvas.height=h,de.drawImage(o,0,0,c,h),o=de.canvas}const E=GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,O=e.textureManager.acquireTexture(p[1],p[0],"rgba8unorm",E);e.queue.copyExternalImageToTexture({source:o},{texture:O},[p[1],p[0]]),b=O}const w=d.util.sizeFromShape(p),I=d.util.computeStrides(p),k=new ru(p,r,m),$=[{type:"uint32",data:[w]},{type:"uint32",data:[r]},{type:"uint32",data:[...I]}],D=e.makeTensorInfo([h,c],"int32"),F=e.tensorMap.get(D.dataId);F.resource=b;const A=e.runWebGPUProgram(k,[D],"int32",$);return e.disposeData(D.dataId),A}const g=o.data;let x=g;if(r!=null&&r!==4){x=new Uint8Array(o.width*o.height*r);const b=g.length;let w=0;for(let I=0;I<b;I++)I%4<r&&(x[w++]=g[I])}const C=e.makeTensorInfo(p,"int32",new Int32Array(x));return e.uploadToGPU(C.dataId),C}class uu{constructor(t,e,i,o,r){this.uniforms="varianceEpsilon : f32,",this.workgroupSize=[128,1,1],this.size=!0,this.variableNames=["x","mean","variance"],d.backend_util.assertAndGetBroadcastShape(t,e),d.backend_util.assertAndGetBroadcastShape(t,i),this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),o!=null&&(d.backend_util.assertAndGetBroadcastShape(t,o),this.variableNames.push("offset")),r!=null&&(d.backend_util.assertAndGetBroadcastShape(t,r),this.variableNames.push("scale")),this.offsetShape=o,this.scaleShape=r,this.shaderKey="batchNorm"}getUserCode(){let t="0.0";this.offsetShape!=null&&(t="getOffsetByOutputIndex(index)");let e="1.0";return this.scaleShape!=null&&(e="getScaleByOutputIndex(index)"),`
      ${y("index")} {
        if (index < uniforms.size)
        {
          let xValue = getXByOutputIndex(index);
          let meanValue = getMeanByOutputIndex(index);
          let varianValue = getVarianceByOutputIndex(index);
          let offsetValue = ${t};
          let scaleValue = ${e};
          let inv = scaleValue * inverseSqrt(varianValue + f32(uniforms.varianceEpsilon));
          setOutputAtIndex(index,dot(vec3<f32>(xValue, -meanValue, offsetValue), vec3<f32>(inv, inv, 1.0)));
        }
      }
  `}}const du={kernelName:d.FusedBatchNorm,backendName:"webgpu",kernelFunc:({inputs:s,attrs:t,backend:e})=>{const{x:i,scale:o,offset:r,mean:n,variance:a}=s,{varianceEpsilon:u}=t,l=e,c=[i,n,a];let h=null;r!=null&&(h=r.shape,c.push(r));let p=null;o!=null&&(p=o.shape,c.push(o));const m=new uu(i.shape,n.shape,a.shape,h,p),f=[{type:"float32",data:[u]}];return l.runWebGPUProgram(m,c,i.dtype,f)}};function lu(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,filter:r,bias:n,preluActivationWeights:a}=t,{strides:u,pad:l,dataFormat:c,dilations:h,dimRoundingMode:p,activation:m,leakyreluAlpha:f}=i,g=d.backend_util.convertConv2DDataFormat(c),x=d.backend_util.computeConv2DInfo(o.shape,r.shape,u,h,l,p,!1,g);return ct({x:o,filter:r,convInfo:x,backend:e,bias:n,preluActivationWeights:a,leakyreluAlpha:f,activation:m})}const cu={kernelName:d.FusedConv2D,backendName:"webgpu",kernelFunc:lu};function hu(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,filter:r,bias:n,preluActivationWeights:a}=t,{strides:u,pad:l,dilations:c,dimRoundingMode:h,activation:p,leakyreluAlpha:m}=i;let f=c;f==null&&(f=[1,1]),d.util.assert(d.backend_util.eitherStridesOrDilationsAreOne(u,f),()=>`Error in depthwiseConv2d: Either strides or dilations must be 1. Got strides ${u} and dilations '${f}'`);const g=d.backend_util.computeConv2DInfo(o.shape,r.shape,u,f,l,h,!0),x=[o,r],C=n!=null,b=a!=null;C&&x.push(n),b&&x.push(a);const w=[{type:"int32",data:[g.padInfo.top,g.padInfo.left]},{type:"int32",data:[g.inHeight,g.inWidth]}];let I;return g.outHeight>4&&g.outWidth>4&&g.strideWidth<=2&&g.inChannels===g.outChannels&&g.dilationHeight===1&&g.dilationWidth===1&&g.inChannels%4===0?(I=new gt(g,C,p,b),w.push({type:"int32",data:[I.virtualWidth]})):(I=new xt(g,C,p,b),w.push({type:"int32",data:[g.filterHeight]},{type:"int32",data:[g.filterWidth]},{type:"int32",data:[g.strideHeight,g.strideWidth]},{type:"int32",data:[g.dilationHeight,g.dilationWidth]})),p==="leakyrelu"&&(w.push({type:"float32",data:[m]}),I.uniforms+=" alpha : f32,"),e.runWebGPUProgram(I,x,"float32",w)}const pu={kernelName:d.FusedDepthwiseConv2D,backendName:"webgpu",kernelFunc:hu};class mu{constructor(t,e){this.variableNames=["A","indices"],this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=e,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey=`gathernd_${t}`,this.sliceDim=t,this.uniforms=`sliceDim : i32, strides : ${L(t)},`}getUserCode(){let t;return this.sliceDim>1?t="uniforms.strides[j]":t="uniforms.strides",`
      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getCoordsFromIndex(index);
          var flattenIndex = 0;
          for (var j = 0; j < uniforms.sliceDim; j = j + 1) {
            let indexTemp = i32(round(getIndices(coords[0], j)));
            let strideNum = ${t};
            flattenIndex = flattenIndex + indexTemp * strideNum;
          }

          setOutputAtIndex(index, getA(flattenIndex, coords[1]));
        }
      }
      `}}function fu(s){const{inputs:t,backend:e}=s,{params:i,indices:o}=t,r=o.shape,n=r[r.length-1],a=d.util.sizeFromShape(i.shape),[u,l,c,h]=d.backend_util.prepareAndValidate(i,o),p=P({inputs:{x:o},backend:e,attrs:{shape:[l,n]}}),m=P({inputs:{x:i},backend:e,attrs:{shape:[d.util.sizeFromShape(i.shape)/c,c]}});if(e.shouldExecuteOnCPU([i,o])||i.dtype==="string"){const b=e.readSync(o.dataId),w=e.bufferSync(i),I=Pi(b,w,i.dtype,l,n,c,h,i.shape,a);return e.makeTensorInfo(u,i.dtype,I.values)}const f=new mu(n,[l,c]),g=[{type:"int32",data:[n]},{type:"int32",data:h}],x=e.runWebGPUProgram(f,[m,p],m.dtype,g),C=P({inputs:{x},backend:e,attrs:{shape:u}});return e.disposeData(p.dataId),e.disposeData(m.dataId),e.disposeData(x.dataId),C}const gu={kernelName:d.GatherNd,backendName:"webgpu",kernelFunc:fu};class xu{constructor(t,e){this.variableNames=["A","indices"],this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.slice(),this.aShape=t,this.outputShape=e,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="gather"}getUserCode(){const t=Cu(this.aShape);return`
      ${y("index")} {
        if (index < uniforms.size) {
          let resRC = getCoordsFromIndex(index);
          let indexZ = i32(getIndices(resRC.x, resRC.z));
          let inBounds = select(0.0, 1.0, indexZ >= 0 && indexZ < uniforms.aShape[2]);
          setOutputAtIndex(index, inBounds * getA(${t}));
        }
      }
    `}}function Cu(s){const t=["resRC.x","resRC.y","resRC.z","resRC.w"],e=[];for(let i=0;i<s.length;i++)i===2?e.push("indexZ"):e.push(`${t[i]}`);return e.join()}function yt(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,indices:r}=t,{axis:n,batchDims:a}=i,u=d.util.parseAxisParam(n,o.shape)[0],l=d.backend_util.segment_util.collectGatherOpShapeInfo(o,r,u,a),c=d.util.sizeFromShape(r.shape),h=[],p=P({inputs:{x:o},backend:e,attrs:{shape:[l.batchSize,l.outerSize,l.dimSize,l.sliceSize]}}),m=P({inputs:{x:r},backend:e,attrs:{shape:[l.batchSize,c/l.batchSize]}});h.push(p),h.push(m);const f=[l.batchSize,l.outerSize,c/l.batchSize,l.sliceSize];if(e.shouldExecuteOnCPU([o,r])){const w=e.tensorMap.get(m.dataId).values,I=d.buffer(m.shape,m.dtype,w),$=e.tensorMap.get(p.dataId).values,D=d.buffer(p.shape,p.dtype,$),F=$i(D,I,f);return h.forEach(A=>e.disposeData(A.dataId)),e.makeTensorInfo(l.outputShape,F.dtype,F.values)}const g=new xu(p.shape,f),x=e.runWebGPUProgram(g,[p,m],p.dtype);h.push(x);const C=P({inputs:{x},backend:e,attrs:{shape:l.outputShape}});return h.forEach(b=>e.disposeData(b.dataId)),C}const bu={kernelName:d.GatherV2,backendName:"webgpu",kernelFunc:yt};const wu=W({opType:N.GREATER,cpuKernelImpl:Ni,dtype:"bool"}),Su={kernelName:d.Greater,backendName:"webgpu",kernelFunc:wu};const yu=W({opType:N.GREATER_EQUAL,dtype:"bool",cpuKernelImpl:Di}),vu={kernelName:d.GreaterEqual,backendName:"webgpu",kernelFunc:yu};function Iu(s){const{inputs:t,backend:e}=s,{input:i}=t;return St(i,!0,e)}const ku={kernelName:d.IFFT,backendName:"webgpu",kernelFunc:Iu};const Ru=_({opType:S.IS_FINITE,dtype:"bool"}),Pu={kernelName:d.IsFinite,backendName:"webgpu",kernelFunc:Ru};const $u=_({opType:S.IS_INF,dtype:"bool"}),Du={kernelName:d.IsInf,backendName:"webgpu",kernelFunc:$u};const Nu=_({opType:S.IS_NAN,dtype:"bool"}),zu={kernelName:d.IsNan,backendName:"webgpu",kernelFunc:Nu};function Au(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{alpha:r}=i,n=[{type:"float32",data:[r]}],a=new ne(o.shape,S.LEAKYRELU,"alpha : f32,");return e.runWebGPUProgram(a,[o],"float32",n)}const Fu={kernelName:d.LeakyRelu,backendName:"webgpu",kernelFunc:Au};const _u=W({opType:N.LESS,dtype:"bool",cpuKernelImpl:Ai}),Lu={kernelName:d.Less,backendName:"webgpu",kernelFunc:_u};const Eu=W({opType:N.LESS_EQUAL,dtype:"bool",cpuKernelImpl:zi}),Tu={kernelName:d.LessEqual,backendName:"webgpu",kernelFunc:Eu};class Bu{constructor(t){this.variableNames=[],this.outputShape=[],this.uniforms="start : f32, step : f32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=[t],this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="linSpace"}getUserCode(){return`
      ${y("index")} {
        if (index < uniforms.size) {
          setOutputAtIndex(index, uniforms.start + f32(index) * uniforms.step);
        }
      }
    `}}function Wu(s){const{backend:t,attrs:e}=s,{start:i,stop:o,num:r}=e,n=(o-i)/(r-1),a=new Bu(r),u=[{type:"float32",data:[i]},{type:"float32",data:[n]}];return t.runWebGPUProgram(a,[],"float32",u)}const Mu={kernelName:d.LinSpace,backendName:"webgpu",kernelFunc:Wu};const Vu=_({opType:S.LOG,cpuKernelImpl:Fi}),Uu={kernelName:d.Log,backendName:"webgpu",kernelFunc:Vu};const Ou=_({opType:S.LOG1P}),Gu={kernelName:d.Log1p,backendName:"webgpu",kernelFunc:Ou};const Hu=W({opType:N.LOGICAL_AND,dtype:"bool"}),Xu={kernelName:d.LogicalAnd,backendName:"webgpu",kernelFunc:Hu};const Ku=_({opType:S.LOGICAL_NOT}),qu={kernelName:d.LogicalNot,backendName:"webgpu",kernelFunc:Ku};const Yu=W({opType:N.LOGICAL_OR}),ju={kernelName:d.LogicalOr,backendName:"webgpu",kernelFunc:Yu};const vt=`
  var powValue = 0.0;
  let basis = uniforms.bias + uniforms.alpha * sum;
  if (uniforms.beta == 0.5) {
    powValue = inverseSqrt(basis);
  } else if (uniforms.beta == 1.0) {
    powValue = 1.0 / basis;
  } else {
    powValue = exp(log(basis) * (-uniforms.beta));
  }
`;class Qu{constructor(t){this.outputShape=[],this.variableNames=["x"],this.uniforms="radius : i32, bias : f32, alpha : f32, beta : f32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="lrn"}getUserCode(){return`
    ${y("index")} {
      if (index < uniforms.size) {
        let coords = getOutputCoords();
        let b = coords[0];
        let r = coords[1];
        let c = coords[2];
        let d = coords[3];

        let x = getX(b, r, c, d);
        var sum = 0.0;
        for (var i = -uniforms.radius; i <= uniforms.radius; i = i + 1) {
          let idx = d + i;
          if (idx >= 0 && idx < uniforms.xShape[3]) {
            let z = getX(b, r, c, idx);
            sum = sum + z * z;
          }
        }
        ${vt}

        setOutputAtIndex(index, x * powValue);
      }
    }
  `}}class Zu{constructor(t,e){this.outputShape=[],this.variableNames=["x"],this.uniforms="radius : i32, bias : f32, alpha : f32, beta : f32,",this.workgroupSize=[256,1,1],this.maxAllowRadius=16,d.util.assert(e<=this.maxAllowRadius,()=>`Radius must be less than or equal to ${this.maxAllowRadius}, current radius is ${e}`),this.outputShape=t,this.elementsPerWorkgroup=this.workgroupSize[0]-2*this.maxAllowRadius,this.dispatchLayout={x:[3],y:[2],z:[0,1]},this.dispatch=v(this.dispatchLayout,this.outputShape,[this.elementsPerWorkgroup,this.workgroupSize[1],this.workgroupSize[2]]),this.shaderKey="lrn_shared"}getUserCode(){return`
    var <workgroup>lrnSub: array<f32, ${this.workgroupSize[0]}>;
    const elementsPerWorkgroup = ${this.elementsPerWorkgroup};
    const maxAllowRadius = ${this.maxAllowRadius};

    ${y()} {
      let localDepth = i32(localId.x);
      let workgroupDepth = i32(workgroupId.x) * elementsPerWorkgroup;
      let xDepth = workgroupDepth + localDepth - maxAllowRadius;
      let b = i32(globalId.z) / uniforms.xShape[1];
      let r = i32(globalId.z) - b * uniforms.xShape[1];
      let c = i32(globalId.y);
      let d = workgroupDepth + localDepth;

      var x = 0.0;
      if (xDepth >= 0 && xDepth < uniforms.xShape[3]) {
        x = getX(b, r, c, xDepth);
      }
      lrnSub[localDepth] = x;
      workgroupBarrier();

      if (localDepth < elementsPerWorkgroup && d < uniforms.outShape[3]) {
        var sum = 0.0;
        let index = localDepth + maxAllowRadius;
        for (var i = -uniforms.radius; i <= uniforms.radius; i = i + 1) {
          let z = lrnSub[index + i];
          sum = sum + z * z;
        }
        ${vt}

        setOutputAtCoords(b, r, c, d, lrnSub[index] * powValue);
      }
    } `}}function Ju(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{depthRadius:r,bias:n,alpha:a,beta:u}=i;let l;r>16?l=new Qu(o.shape):l=new Zu(o.shape,r);const c=[{type:"int32",data:[r]},{type:"float32",data:[n]},{type:"float32",data:[a]},{type:"float32",data:[u]}];return e.runWebGPUProgram(l,[o],o.dtype,c)}const ed={kernelName:d.LRN,backendName:"webgpu",kernelFunc:Ju};class td{constructor(t){this.outputShape=[],this.variableNames=["inputImage","outputImage","dy"],this.uniforms="depthRadius : i32, bias : f32, alpha : f32, beta : f32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="lrn_grad"}getUserCode(){return`
    ${y("index")} {
      if (index < uniforms.size) {
        let coords = getOutputCoords();
        let b = coords[0];
        let r = coords[1];
        let c = coords[2];

        let MIN_DEPTH_BEGIN = 0;
        let MAX_DEPTH_END = uniforms.outShape[3];
        var result = 0.0;
        for (var d = MIN_DEPTH_BEGIN; d < MAX_DEPTH_END; d++) {
          let depthBegin = max(MIN_DEPTH_BEGIN, d - uniforms.depthRadius);
          let depthEnd = min(MAX_DEPTH_END, d + uniforms.depthRadius + 1);

          var norm = 0.0;
          for (var k = MIN_DEPTH_BEGIN; k < MAX_DEPTH_END; k++) {
            if (k < depthBegin) {
              continue;
            } else if (k >= depthBegin && k < depthEnd) {
              norm += getInputImage(b, r, c, k) * getInputImage(b, r, c, k);
            } else {
              break;
            }
          }

          norm = uniforms.alpha * norm + uniforms.bias;

          for (var k = MIN_DEPTH_BEGIN; k < MAX_DEPTH_END; k++) {
            if (k < depthBegin) {
              continue;
            } else if (k >= depthBegin && k < depthEnd) {
              var dyi = -2.0 * uniforms.alpha * uniforms.beta
                * getInputImage(b, r, c, k) * getOutputImage(b, r, c, d) / norm;
              if (k == d) {
                dyi += pow(norm, -1.0 * uniforms.beta);
              }
              if (k == coords[3]) {
                dyi *= getDy(b, r, c, d);
                result += dyi;
              }
            } else {
              break;
            }
          }
        }

        setOutputAtIndex(index, result);
      }
    }
  `}}function sd(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,y:r,dy:n}=t,{depthRadius:a,bias:u,alpha:l,beta:c}=i,h=new td(o.shape),p=[{type:"int32",data:[a]},{type:"float32",data:[u]},{type:"float32",data:[l]},{type:"float32",data:[c]}];return e.runWebGPUProgram(h,[o,r,n],o.dtype,p)}const od={kernelName:d.LRNGrad,backendName:"webgpu",kernelFunc:sd};const id=W({opType:N.MAX,cpuKernelImpl:Li}),rd={kernelName:d.Maximum,backendName:"webgpu",kernelFunc:id};function nd(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{filterSize:r,strides:n,pad:a,dimRoundingMode:u}=i,c=d.backend_util.computePool2DInfo(o.shape,r,n,1,a,u);return nt(o,c,"max",e)}const ad={kernelName:d.MaxPool,backendName:"webgpu",kernelFunc:nd};function ud(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{filterSize:r,strides:n,pad:a,dataFormat:u,dimRoundingMode:l}=i,c=[1,1,1],h=d.backend_util.computePool3DInfo(o.shape,r,n,c,a,l,u),p=new Te(h,"max"),m=[{type:"int32",data:[h.strideDepth,h.strideHeight,h.strideWidth]},{type:"int32",data:[h.padInfo.front,h.padInfo.top,h.padInfo.left]},{type:"int32",data:[h.inDepth,h.inHeight,h.inWidth]},{type:"int32",data:[h.effectiveFilterDepth,h.effectiveFilterHeight,h.effectiveFilterWidth]}];return e.runWebGPUProgram(p,[o],o.dtype,m)}const dd={kernelName:d.MaxPool3D,backendName:"webgpu",kernelFunc:ud};class ld{constructor(t){this.variableNames=["dy","maxPos"],this.uniforms=`strides : vec2<i32>, pads : vec2<i32>, dilations : vec2<i32>, filterDims : vec2<i32>,
       outHeight : i32, outWidth : i32`,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.inShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="maxPool2DBackprop"}getUserCode(){return`
      ${y("index")} {
      if (index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        let batch = coords[0];
        let d = coords[3];

        let dyRCCorner = vec2<i32>(coords.yz) - uniforms.pads;
        let dyRCorner = dyRCCorner.x;
        let dyCCorner = dyRCCorner.y;

        // Convolve dy(?, ?, d) with pos mask(:, :, d) to get dx(xR, xC, d).
        // ? = to be determined. : = across all values in that axis.
        var dotProd = 0.0;
        let lastIndex = uniforms.filterDims[0] * uniforms.filterDims[1] - 1;
        for (var wR = 0; wR < uniforms.filterDims[0]; wR += uniforms.dilations[0]) {
          let dyR = f32(dyRCorner + wR) / f32(uniforms.strides[0]);

          if (dyR < 0.0 || dyR >= f32(uniforms.outHeight) || fract(dyR) > 0.0) {
            continue;
          }
          let idyR = i32(dyR);

          for (var wC = 0; wC < uniforms.filterDims[1]; wC += uniforms.dilations[1]) {
            let dyC = f32(dyCCorner + wC) / f32(uniforms.strides[1]);

            if (dyC < 0.0 || dyC >= f32(uniforms.outWidth) || fract(dyC) > 0.0) {
              continue;
            }
            let idyC = i32(dyC);

            let dyValue = getDy(batch, idyR, idyC, d);
            let maxPosValue = lastIndex - i32(getMaxPos(batch, idyR, idyC, d));

            // Get the current value, check it against the value from the
            // position matrix.
            let curPosValue = wR * uniforms.filterDims[1] + wC;
            let mask = select(0.0, 1.0, maxPosValue == curPosValue);
            dotProd += dyValue * mask;
          }
        }
        setOutputAtIndex(index, dotProd);
      }
    }
    `}}class cd{constructor(t){this.variableNames=["dy","maxPos"],this.uniforms=`strides : vec3<i32>, pads : vec3<i32>, filterDims : vec3<i32>,
      outDepth : i32, outHeight : i32, outWidth : i32`,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t.inShape,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="maxPool3DBackprop"}getUserCode(){return`
      ${y("index")} {
      if (index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
        let batch = coords.x;
        let ch = coords.u;

        let dyCorner = vec3<i32>(coords.y, coords.z, coords.w) - uniforms.pads;
        let dyDCorner = dyCorner.x;
        let dyRCorner = dyCorner.y;
        let dyCCorner = dyCorner.z;

        // Convolve dy(?, ?, ?, ch) with pos mask(:, :, :, d) to get
        // dx(xD, xR, xC, ch).
        // ? = to be determined. : = across all values in that axis.
        var dotProd = 0.0;
        let lastIndex = uniforms.filterDims[0] * uniforms.filterDims[1] * uniforms.filterDims[2] - 1;

        for (var wD = 0; wD < uniforms.filterDims[0]; wD++) {
          let dyD = f32(dyDCorner + wD) / f32(uniforms.strides[0]);

          if (dyD < 0.0 || dyD >= f32(uniforms.outDepth) || fract(dyD) > 0.0) {
            continue;
          }
          let idyD = i32(dyD);

          for (var wR = 0; wR < uniforms.filterDims[1]; wR++) {
            let dyR = f32(dyRCorner + wR) / f32(uniforms.strides[1]);

            if (dyR < 0.0 || dyR >= f32(uniforms.outHeight) || fract(dyR) > 0.0) {
              continue;
            }
            let idyR = i32(dyR);

            for (var wC = 0; wC < uniforms.filterDims[2]; wC++) {
              let dyC = f32(dyCCorner + wC) / f32(uniforms.strides[2]);

              if (dyC < 0.0 || dyC >= f32(uniforms.outWidth) || fract(dyC) > 0.0) {
                continue;
              }
              let idyC = i32(dyC);

              let dyValue = getDy(batch, idyD, idyR, idyC, ch);
              let maxPosValue = lastIndex - i32(getMaxPos(batch, idyD, idyR, idyC, ch));

              // Get the current value, check it against the value from the
              // position matrix.
              let curPosValue = wD * uniforms.filterDims[1] * uniforms.filterDims[2] + wR * uniforms.filterDims[2] + wC;
              let mask = select(0.0, 1.0, maxPosValue == curPosValue);
              dotProd += dyValue * mask;
            }
          }
        }

        setOutputAtIndex(index, dotProd);
      }
    }
    `}}function hd(s){const{inputs:t,backend:e,attrs:i}=s,{dy:o,input:r}=t,n=r,{filterSize:a,strides:u,pad:l,dimRoundingMode:c}=i,h=[1,1,1],p=d.backend_util.computePool3DInfo(n.shape,a,u,h,l,c),m=new Te(p,"max",!0);let f=[{type:"int32",data:[p.strideDepth,p.strideHeight,p.strideWidth]},{type:"int32",data:[p.padInfo.front,p.padInfo.top,p.padInfo.left]},{type:"int32",data:[p.inDepth,p.inHeight,p.inWidth]},{type:"int32",data:[p.effectiveFilterDepth,p.effectiveFilterHeight,p.effectiveFilterWidth]}];const g=e.runWebGPUProgram(m,[n],"int32",f),x=new cd(p);f=[{type:"int32",data:[p.strideDepth,p.strideHeight,p.strideWidth]},{type:"int32",data:[p.effectiveFilterDepth-1-p.padInfo.front,p.effectiveFilterHeight-1-p.padInfo.top,p.effectiveFilterWidth-1-p.padInfo.left]},{type:"int32",data:[p.effectiveFilterDepth,p.effectiveFilterHeight,p.effectiveFilterWidth]},{type:"int32",data:[p.outDepth]},{type:"int32",data:[p.outHeight]},{type:"int32",data:[p.outWidth]}];const C=e.runWebGPUProgram(x,[o,g],n.dtype,f);return e.disposeData(g.dataId),C}const pd={kernelName:d.MaxPool3DGrad,backendName:"webgpu",kernelFunc:hd};function md(s){const{inputs:t,backend:e,attrs:i}=s,{dy:o,input:r,output:n}=t,a=r;_e([r,n],"maxPoolGrad");const{filterSize:u,strides:l,pad:c,dimRoundingMode:h}=i,p=d.backend_util.computePool2DInfo(a.shape,u,l,1,c,h),m=new pe(p,"max",!0);let f=[{type:"int32",data:[p.strideHeight,p.strideWidth]},{type:"int32",data:[p.padInfo.top,p.padInfo.left]},{type:"int32",data:[p.dilationHeight,p.dilationWidth]},{type:"int32",data:[p.inHeight,p.inWidth]},{type:"int32",data:[p.effectiveFilterHeight,p.effectiveFilterWidth]}];const g=e.runWebGPUProgram(m,[a],"int32",f),x=new ld(p);f=[{type:"int32",data:[p.strideHeight,p.strideWidth]},{type:"int32",data:[p.effectiveFilterHeight-1-p.padInfo.top,p.effectiveFilterWidth-1-p.padInfo.left]},{type:"int32",data:[p.dilationHeight,p.dilationWidth]},{type:"int32",data:[p.effectiveFilterHeight,p.effectiveFilterWidth]},{type:"int32",data:[p.outHeight]},{type:"int32",data:[p.outWidth]}];const C=e.runWebGPUProgram(x,[o,g],a.dtype,f);return e.disposeData(g.dataId),C}const fd={kernelName:d.MaxPoolGrad,backendName:"webgpu",kernelFunc:md};function gd(s){const{inputs:t,backend:e,attrs:i}=s,{filterSize:o,strides:r,pad:n,includeBatchInIndex:a}=i,{x:u}=t;d.util.assert(u.shape.length===4,()=>`Error in maxPool: input must be rank 4 but got rank ${u.shape.length}.`);const l=[1,1];d.util.assert(d.backend_util.eitherStridesOrDilationsAreOne(r,l),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${r} and dilations '${l}'`);const c=d.backend_util.computePool2DInfo(u.shape,o,r,l,n),h=[{type:"int32",data:[c.strideHeight,c.strideWidth]},{type:"int32",data:[c.padInfo.top,c.padInfo.left]},{type:"int32",data:[c.dilationHeight,c.dilationWidth]},{type:"int32",data:[c.inHeight,c.inWidth]},{type:"int32",data:[c.effectiveFilterHeight,c.effectiveFilterWidth]}];let p=new pe(c,"max",!1);const m=e.runWebGPUProgram(p,[u],u.dtype,h);p=new pe(c,"max",!0,!0,a);const f=e.runWebGPUProgram(p,[u],"int32",h);return[m,f]}const xd={kernelName:d.MaxPoolWithArgmax,backendName:"webgpu",kernelFunc:gd};function Cd(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{axis:r,keepDims:n}=i;return ie(o,r,n,"min",e)}const bd={kernelName:d.Min,backendName:"webgpu",kernelFunc:Cd};const wd=W({opType:N.MIN,cpuKernelImpl:Ei}),Sd={kernelName:d.Minimum,backendName:"webgpu",kernelFunc:wd};class yd{constructor(t,e,i){this.uniforms="",this.variableNames=["x"],this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=e.map((o,r)=>o[0]+t[r]+o[1]),this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.xShape=t,e.map((o,r)=>{this.uniforms+=` pad${r} : vec2<i32>,`}),this.offset=i==="reflect"?0:1,this.shaderKey=`mirrorPad_${i}`}getUserCode(){const t=this.xShape.length,e=this.xShape.map((l,c)=>`uniforms.pad${c}[0]`).join(","),i=this.xShape.map((l,c)=>`uniforms.pad${c}[0] + uniforms.xShape${t>1?`[${c}]`:""}`).join(","),o=t===1?"start":"start[i]",r=t===1?"end":"end[i]",n=t===1?"outC":"outC[i]",a=L(t),u=t>1?["coords[0]","coords[1]","coords[2]","coords[3]"].slice(0,t):"coords";return`
      ${y("index")} {
        if (index < uniforms.size) {
          let start = ${a}(${e});
          let end = ${a}(${i});
          var outC = getCoordsFromIndex(index);
          for (var i = 0; i < ${t}; i = i + 1) {
            if (${n} < ${o}) {
              ${n} = ${o} * 2 - ${n} - ${this.offset};
            } else if(${n} >= ${r}) {
              ${n} = (${r} - 1) * 2 - ${n} + ${this.offset};
            }
          }
          let coords = outC - start;
          setOutputAtIndex(index, getX(${u}));
        }
      }
    `}}const vd={kernelName:d.MirrorPad,backendName:"webgpu",kernelFunc:({inputs:s,attrs:t,backend:e})=>{const{x:i}=s,{paddings:o,mode:r}=t,n=e,a=o.map(c=>({type:"int32",data:[c[0],c[1]]})),u=new yd(i.shape,o,r);return n.runWebGPUProgram(u,[i],i.dtype,a)}};const Id=W({opType:N.MOD}),kd={kernelName:d.Mod,backendName:"webgpu",kernelFunc:Id};class Rd{constructor(t,e){this.variableNames=["probs"],this.outputShape=[],this.uniforms="seed : f32, numOutcomes: i32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=[t,e],this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="multinomial"}getUserCode(){return`
    //Based on the work of Dave Hoskins
    //https://www.shadertoy.com/view/4djSRW
    fn random (seed : f32, resultUV : vec2<f32>) -> f32 {
      let HASHSCALE1 = 443.8975;
      let p = resultUV * seed;
      var p3  = fract(vec3<f32>(p.xyx) * HASHSCALE1);
      p3 = p3 + dot(p3, p3.yzx + 19.19);
      return fract((p3.x + p3.y) * p3.z);
    }

    ${y("index")} {
      if (index < uniforms.size) {
        let coords = getOutputCoords();
        let batch = coords[0];

        let resUV = vec2<f32>(f32(coords[1]) / f32(uniforms.outShape[1]),
            f32(coords[0]) / f32(uniforms.outShape[0]));
        let r = random(uniforms.seed, resUV);
        var cdf = 0.0;
        for (var i = 0; i < uniforms.numOutcomes - 1; i = i + 1) {
          cdf = cdf + getProbs(batch, i);

          if (r < cdf) {
            setOutputAtIndexI32(index, i);
            return;
          }
        }

        // If no other event happened, last event happened.
        setOutputAtIndexI32(index, uniforms.numOutcomes - 1);
      }
    }
  `}}class Pd{constructor(t){this.variableNames=["logits"],this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=[this.outputShape[0],1,1],this.outputShape[1]>=4096?this.workgroupSize=[256,1,1]:this.workgroupSize=[64,1,1],this.shaderKey="softmax"}getUserCode(){return`
    var<workgroup> buf : array<f32, ${this.workgroupSize[0]}>;
    var<workgroup> rowMaxShared : f32;
    var<workgroup> rowSumShared : f32;
    const blockSize = ${this.workgroupSize[0]};
    ${y("index")} {
      let row = index / blockSize;
      let tid = i32(localId.x);
      let cols = uniforms.outShape[1];

      var threadMax = -3.402823e+38f;
      for (var col = tid; col < cols; col += blockSize) {
        let value = getLogits(row, col);
        threadMax = max(threadMax, value);
      }
      if (tid < cols) {
        buf[tid] = threadMax;
      }
      workgroupBarrier();

      var reduceSize = min(cols, blockSize);
      for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
        reduceSize = currSize + (reduceSize & 1);
        if (tid < currSize) {
          buf[tid] = max(buf[tid], buf[tid + reduceSize]);
        }
        workgroupBarrier();
      }

      if (tid == 0) {
        rowMaxShared = buf[0];
      }
      workgroupBarrier();

      var threadSum = 0.0;
      for (var col = tid; col < cols; col += blockSize) {
        let subExp = exp(getLogits(row, col) - rowMaxShared);
        threadSum += subExp;
      }
      buf[tid] = threadSum;
      workgroupBarrier();

      for (var currSize = blockSize >> 1;  currSize > 0; currSize = currSize >> 1) {
        if (tid < currSize) {
          buf[tid] = buf[tid] + buf[tid + currSize];
        }
        workgroupBarrier();
      }

      if (tid == 0) {
        rowSumShared = buf[0];
      }
      workgroupBarrier();

      for (var col = tid; col < cols; col += blockSize) {
        let value = exp(getLogits(row, col) - rowMaxShared) / rowSumShared;
        setOutputAtCoords(row, col, value);
      }
  }
    `}}function It(s){const{inputs:t,backend:e,attrs:i}=s,{logits:o}=t,{dim:r}=i,n=P({inputs:{x:o},backend:e,attrs:{shape:[d.util.sizeFromShape(o.shape)/o.shape[r],o.shape[r]]}}),a=new Pd(n.shape),u=e.runWebGPUProgram(a,[n],o.dtype),l=P({inputs:{x:u},backend:e,attrs:{shape:o.shape}});return e.disposeData(n.dataId),e.disposeData(u.dataId),l}const $d={kernelName:d.Softmax,backendName:"webgpu",kernelFunc:It};function Dd(s){const{inputs:t,backend:e,attrs:i}=s,{logits:o}=t,{numSamples:r,seed:n,normalized:a}=i,u=a?o:It({inputs:{logits:o},backend:e,attrs:{dim:o.shape.length-1}}),l=u.shape[0],c=u.shape[1],h=new Rd(l,r),p=[{type:"float32",data:[n]},{type:"int32",data:[c]}],m=e.runWebGPUProgram(h,[u],"int32",p);return a||e.disposeData(u.dataId),m}const Nd={kernelName:d.Multinomial,backendName:"webgpu",kernelFunc:Dd};function zd(s){const{inputs:t,backend:e}=s,{x:i}=t;if(e.shouldExecuteOnCPU([i])){const r=e.tensorMap.get(i.dataId),[n,a]=Bi(r.values,i.shape,i.dtype);return e.makeTensorInfo(a,i.dtype,n)}const o=new ne(i.shape,S.NEG);return e.runWebGPUProgram(o,[i],i.dtype)}const Ad={kernelName:d.Neg,backendName:"webgpu",kernelFunc:zd};function Fd(s){console.warn("tf.nonMaxSuppression() in webgpu locks the UI thread. Call tf.nonMaxSuppressionAsync() instead");const{inputs:t,backend:e,attrs:i}=s,{boxes:o,scores:r}=t,{maxOutputSize:n,iouThreshold:a,scoreThreshold:u}=i,l=e.readSync(o.dataId),c=e.readSync(r.dataId),{selectedIndices:h}=d.kernel_impls.nonMaxSuppressionV3Impl(l,c,n,a,u);return e.makeTensorInfo([h.length],"int32",new Int32Array(h))}const _d={kernelName:d.NonMaxSuppressionV3,backendName:"webgpu",kernelFunc:Fd};function Ld(s){console.warn("tf.nonMaxSuppression() in webgpu locks the UI thread. Call tf.nonMaxSuppressionAsync() instead");const{inputs:t,backend:e,attrs:i}=s,{boxes:o,scores:r}=t,{maxOutputSize:n,iouThreshold:a,scoreThreshold:u,softNmsSigma:l}=i,c=e.readSync(o.dataId),h=e.readSync(r.dataId),p=n,m=a,f=u,g=l,{selectedIndices:x,selectedScores:C}=d.kernel_impls.nonMaxSuppressionV5Impl(c,h,p,m,f,g);return[e.makeTensorInfo([x.length],"int32",new Int32Array(x)),e.makeTensorInfo([C.length],"float32",new Float32Array(C))]}const Ed={kernelName:d.NonMaxSuppressionV5,backendName:"webgpu",kernelFunc:Ld};class Td{constructor(t,e){this.variableNames=["x"],this.uniforms="onValue : f32, offValue : f32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=[t,e],this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="onehot"}getUserCode(){return`
      ${y("index")} {
        if(index < uniforms.size) {
          let coords = getCoordsFromIndex(index);
          setOutputAtIndex(index, mix(uniforms.offValue, uniforms.onValue,
                                      f32(i32(round(getX(coords.x))) == coords.y)));
        }
      }
    `}}function Bd(s){const{inputs:t,backend:e,attrs:i}=s,{indices:o}=t,{dtype:r,depth:n,onValue:a,offValue:u}=i,l=d.util.sizeFromShape(o.shape),c=new Td(l,n),h=P({inputs:{x:o},backend:e,attrs:{shape:[l]}}),p=[{type:"float32",data:[a]},{type:"float32",data:[u]}],m=e.runWebGPUProgram(c,[h],r,p);e.disposeData(h.dataId);const f=[...o.shape,n],g=P({inputs:{x:m},backend:e,attrs:{shape:f}});return e.disposeData(m.dataId),g}const Wd={kernelName:d.OneHot,backendName:"webgpu",kernelFunc:Bd};function $e(s){const{inputs:t,backend:e}=s,{x:i}=t;if(i.dtype==="complex64"){const o=me({inputs:{input:i},backend:e}),r=$e({inputs:{x:o},backend:e}),n=Re({inputs:{input:i},backend:e}),a=$e({inputs:{x:n},backend:e}),u=oe({inputs:{real:r,imag:a},backend:e});return e.disposeData(o.dataId),e.disposeData(r.dataId),e.disposeData(n.dataId),e.disposeData(a.dataId),u}else return G({attrs:{shape:i.shape,dtype:i.dtype,value:i.dtype==="string"?"":0},backend:e})}const Md={kernelName:d.ZerosLike,backendName:"webgpu",kernelFunc:$e};function kt(s){const{inputs:t,backend:e}=s,{x:i}=t;if(i.dtype==="string")throw new Error("onesLike is not supported under string dtype");if(i.dtype==="complex64"){const o=me({inputs:{input:i},backend:e}),r=kt({inputs:{x:o},backend:e}),n=Re({inputs:{input:i},backend:e}),a=$e({inputs:{x:n},backend:e}),u=oe({inputs:{real:r,imag:a},backend:e});return e.disposeData(o.dataId),e.disposeData(r.dataId),e.disposeData(n.dataId),e.disposeData(a.dataId),u}else return G({attrs:{shape:i.shape,dtype:i.dtype,value:1},backend:e})}const Vd={kernelName:d.OnesLike,backendName:"webgpu",kernelFunc:kt};function Ud(s){const{inputs:t,backend:e,attrs:i}=s,{axis:o}=i;if(t.length===1)return Me({inputs:{input:t[0]},backend:e,attrs:{dim:o}});const r=t[0].shape,n=t[0].dtype;t.forEach(c=>{d.util.assertShapesMatch(r,c.shape,"All tensors passed to stack must have matching shapes"),d.util.assert(n===c.dtype,()=>"All tensors passed to stack must have matching dtypes")});const a=[],u=t.map(c=>{const h=Me({inputs:{input:c},backend:e,attrs:{dim:o}});return a.push(h),h}),l=lt({inputs:u,backend:e,attrs:{axis:o}});return a.forEach(c=>e.disposeData(c.dataId)),l}const Od={kernelName:d.Pack,backendName:"webgpu",kernelFunc:Ud};function Rt(s,t=!1){const e=s.length,i=L(e),o=s.map((h,p)=>`uniforms.pad${p}[0]`).join(","),r=s.map((h,p)=>`uniforms.pad${p}[0] + uniforms.xShape${e>1?`[${p}]`:""}`).join(","),n=e>1?`${i}(${o})`:`${o}`,a=e>1?`${i}(${r})`:`${r}`,u=e>1?"any(paddedCoords < start)":"paddedCoords < start",l=e>1?"any(paddedCoords >= end)":"paddedCoords >= end",c=e>1?["coords[0]","coords[1]","coords[2]","coords[3]"].slice(0,e):"coords";return`
        let start = ${n};
        let end = ${a};
        if (${u} || ${l}) {
          setOutputAtIndex(index, ${t?0:"uniforms.constantValue"});
        } else {
          let coords = paddedCoords - start;
          setOutputAtIndex(index, getX(${c}));
        }
  `}class Gd{constructor(t,e){this.variableNames=["x"],this.uniforms="constantValue : f32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=e.map((i,o)=>i[0]+t[o]+i[1]),this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),e.map((i,o)=>{this.uniforms+=` pad${o} : vec2<i32>,`}),this.xShape=t,this.shaderKey="pad"}getUserCode(){return`
      ${y("index")} {
        if (index < uniforms.size) {
          let paddedCoords = getCoordsFromIndex(index);
          ${Rt(this.xShape)}
        }
      }
    `}}const Hd=s=>{const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{paddings:r,constantValue:n}=i;if(r.every(l=>d.util.arraysEqual(l,[0,0])))return H({inputs:{x:o},backend:e});if(d.util.sizeFromShape(o.shape)===0){const l=r.map((c,h)=>c[0]+o.shape[h]+c[1]);return G({backend:e,attrs:{shape:l,value:n,dtype:o.dtype}})}const a=[{type:"float32",data:[n]}];r.map(l=>a.push({type:"int32",data:[l[0],l[1]]}));const u=new Gd(o.shape,r);return e.runWebGPUProgram(u,[o],o.dtype,a)},Xd={kernelName:d.PadV2,backendName:"webgpu",kernelFunc:Hd};const Kd=W({opType:N.POW}),qd={kernelName:d.Pow,backendName:"webgpu",kernelFunc:Kd};function Yd(s){const{inputs:t,backend:e}=s,{x:i,alpha:o}=t,r=new ke(N.PRELU,i.shape,o.shape);return e.runWebGPUProgram(r,[i,o],"float32")}const jd={kernelName:d.Prelu,backendName:"webgpu",kernelFunc:Yd};function Qd(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{axis:r,keepDims:n}=i;return ie(o,r,n,"prod",e)}const Zd={kernelName:d.Prod,backendName:"webgpu",kernelFunc:Qd};const Jd=s=>{const{backend:t,attrs:e}=s,{start:i,stop:o,step:r,dtype:n}=e,a=Vi(i,o,r,n);return t.makeTensorInfo([a.length],n,a)},el={kernelName:d.Range,backendName:"webgpu",kernelFunc:Jd};const tl=W({opType:N.DIV}),sl={kernelName:d.RealDiv,backendName:"webgpu",kernelFunc:tl};const ol=_({opType:S.RECIPROCAL}),il={kernelName:d.Reciprocal,backendName:"webgpu",kernelFunc:ol};const rl=_({opType:S.RELU}),nl={kernelName:d.Relu,backendName:"webgpu",kernelFunc:rl};const al=_({opType:S.RELU6}),ul={kernelName:d.Relu6,backendName:"webgpu",kernelFunc:al};class dl{constructor(t,e,i){this.variableNames=["x"],this.uniforms="adjustHeightWidth : vec2<f32>, halfPixelCenters : f32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=[t[0],e,i,t[3]],this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="resizeBilinear"}getUserCode(){return`
      ${y("index")} {
        if (index < uniforms.size) {
        let coords = getCoordsFromIndex(index);
          let b = coords[0];
          let d = coords[3];
          let rc = coords.yz;

          let effectiveInSize = vec2<f32>(
            f32(uniforms.xShape.y) - uniforms.adjustHeightWidth[0],
            f32(uniforms.xShape.z) - uniforms.adjustHeightWidth[1]);

          let effectiveOutSize = vec2<f32>(
            f32(uniforms.outShape.y) - uniforms.adjustHeightWidth[0],
            f32(uniforms.outShape.z) - uniforms.adjustHeightWidth[1]);

          let effectiveInputOverOutputRatioRC =
              effectiveInSize / effectiveOutSize;

          // Fractional source index
          let sourceFracIndexRC =
            (vec2<f32>(rc) + vec2<f32>(uniforms.halfPixelCenters)) *
            effectiveInputOverOutputRatioRC - vec2<f32>(uniforms.halfPixelCenters);

          // Compute the four integer indices.
          let sourceFloorRC = vec2<i32>(sourceFracIndexRC);
          let sourceCeilRC = vec2<i32>(
            min(vec2<f32>(uniforms.xShape.yz) - vec2<f32>(1.0), ceil(sourceFracIndexRC)));

          let topLeft = getX(b, sourceFloorRC.x, sourceFloorRC.y, d);
          let bottomLeft = getX(b, sourceCeilRC.x, sourceFloorRC.y, d);
          let topRight = getX(b, sourceFloorRC.x, sourceCeilRC.y, d);
          let bottomRight = getX(b, sourceCeilRC.x, sourceCeilRC.y, d);

          let fracRC = sourceFracIndexRC - vec2<f32>(sourceFloorRC);

          let top = topLeft + (topRight - topLeft) * fracRC.y;
          let bottom = bottomLeft + (bottomRight - bottomLeft) * fracRC.y;
          let newValue = top + (bottom - top) * fracRC.x;

          setOutputAtIndex(index, newValue);
        }
      }
    `}}function ll(s){const{inputs:t,backend:e,attrs:i}=s,{images:o}=t,{alignCorners:r,size:n,halfPixelCenters:a}=i,[u,l]=n,c=r&&u>1?1:0,h=r&&l>1?1:0,m=[{type:"float32",data:[c,h]},{type:"float32",data:[a?.5:0]}],f=new dl(o.shape,u,l);return e.runWebGPUProgram(f,[o],"float32",m)}const cl={kernelName:d.ResizeBilinear,backendName:"webgpu",kernelFunc:ll};class hl{constructor(t,e){this.variableNames=["dy"],this.uniforms=`effectiveXSize : vec2<i32>, effectiveYSize : vec2<i32>, heightScale : f32, widthScale : f32,
       invHeightScale : f32, invWidthScale : f32, winHeight : i32, winWidth : i32,`,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.alignCorners=e,this.shaderKey=`resizeBilinearBackprop_${e}`}getUserCode(){return`
      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getOutputCoords();
          let b = coords[0];
          let d = coords[3];
          let r = coords[1];
          let c = coords[2];

          var accumulator = 0.0;

          // Compute bounds for where in dy we will look
          let startRLerp = floor(f32(r) * uniforms.invHeightScale);
          let startDyR = i32(startRLerp - f32(uniforms.winHeight / 2));

          let startCLerp = floor(f32(c) * uniforms.invWidthScale);
          let startDyC = i32(startCLerp - f32(uniforms.winWidth / 2));

          // Loop over dy
          for (var dyROffset = 0; dyROffset < uniforms.winHeight; dyROffset++) {
            let dyR = startDyR + dyROffset;

            // Guard against the window exceeding the bounds of dy
            if (dyR < 0 || dyR >= uniforms.dyShape[1]) {
              continue;
            }

            for (var dyCOffset = 0; dyCOffset < uniforms.winWidth; dyCOffset++) {
              let dyC = startDyC + dyCOffset;

              // Guard against the window exceeding the bounds of dy
              if (dyC < 0 || dyC >= uniforms.dyShape[2]) {
                continue;
              }

              let dxR = f32(dyR) * uniforms.heightScale;
              let topDxRIndex = i32(floor(dxR));
              let bottomDxRIndex = i32(min(ceil(dxR), f32(uniforms.outShape[1] - 1)));
              let dxRLerp = dxR - f32(topDxRIndex);
              let inverseDxRLerp = 1.0 - dxRLerp;

              let dxC = f32(dyC) * uniforms.widthScale;
              let leftDxCIndex = i32(floor(dxC));
              let rightDxCIndex = i32(min(ceil(dxC), f32(uniforms.outShape[2] - 1)));
              let dxCLerp = dxC - f32(leftDxCIndex);
              let inverseDxCLerp = 1.0 - dxCLerp;

              if (r == topDxRIndex && c == leftDxCIndex) {
                // topLeft
                accumulator +=
                  getDy(b, dyR, dyC, d) * inverseDxRLerp * inverseDxCLerp;
              }

              if (r == topDxRIndex && c == rightDxCIndex) {
                // topRight
                accumulator += getDy(b, dyR, dyC, d) * inverseDxRLerp * dxCLerp;
              }

              if (r == bottomDxRIndex && c == leftDxCIndex) {
                // bottomLeft
                accumulator += getDy(b, dyR, dyC, d) * dxRLerp * inverseDxCLerp;
              }

              if (r == bottomDxRIndex && c == rightDxCIndex) {
                // bottomRight
                accumulator += getDy(b, dyR, dyC, d) * dxRLerp * dxCLerp;
              }
            }
          }
          // End loop over dy

          setOutputAtIndex(index, accumulator);
        }
      }
    `}}function pl(s){const{inputs:t,backend:e,attrs:i}=s,{images:o,dy:r}=t,{alignCorners:n}=i,[,a,u]=o.shape,[,l,c]=r.shape,h=[n&&l>1?a-1:a,n&&c>1?u-1:u],p=[n&&l>1?l-1:l,n&&c>1?c-1:c],m=h[0]/p[0],f=h[1]/p[1],g=1/m,x=1/f,C=Math.ceil(g)*2+2,b=Math.ceil(x)*2+2,w=new hl(o.shape,n),I=[{type:"int32",data:h},{type:"int32",data:p},{type:"float32",data:[m]},{type:"float32",data:[f]},{type:"float32",data:[g]},{type:"float32",data:[x]},{type:"int32",data:[C]},{type:"int32",data:[b]}];return e.runWebGPUProgram(w,[r],r.dtype,I)}const ml={kernelName:d.ResizeBilinearGrad,backendName:"webgpu",kernelFunc:pl};class fl{constructor(t,e,i,o){this.variableNames=["x"],this.uniforms="adjustHeightWidth : vec2<f32>, roundBase : f32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=[t[0],e,i,t[3]],this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.halfPixelCenters=o,this.shaderKey=`resizeNearest_${o}`}getUserCode(){let t;return this.halfPixelCenters?t="max((vec2<f32>(rc) + vec2<f32>(0.5)) * effectiveInputOverOutputRatioRC, vec2<f32>(0.0))":t="vec2<f32>(rc) * effectiveInputOverOutputRatioRC",`
      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getCoordsFromIndex(index);
          let b = coords[0];
          let d = coords[3];
          let rc = coords.yz;

          let effectiveInSize = vec2<f32>(
            f32(uniforms.xShape.y) - uniforms.adjustHeightWidth[0],
            f32(uniforms.xShape.z) - uniforms.adjustHeightWidth[1]);

          let effectiveOutSize = vec2<f32>(
            f32(uniforms.outShape.y) - uniforms.adjustHeightWidth[0],
            f32(uniforms.outShape.z) - uniforms.adjustHeightWidth[1]);

          let effectiveInputOverOutputRatioRC =
              effectiveInSize / effectiveOutSize;

          // Fractional source index
          let sourceFracIndexRC = ${t};

          // Compute the coordinators of nearest neighbor point.
          let inputShapeRC = vec2<f32>(f32(uniforms.xShape.y), f32(uniforms.xShape.z));
          let sourceNearestRC = vec2<i32>(
            min(inputShapeRC - 1.0, floor(sourceFracIndexRC + uniforms.roundBase)));
          let newValue = getX(b, sourceNearestRC.x, sourceNearestRC.y, d);

          setOutputAtIndex(index, newValue);
        }
      }
    `}}function gl(s){const{inputs:t,backend:e,attrs:i}=s,{images:o}=t,{alignCorners:r,halfPixelCenters:n,size:a}=i,[u,l]=a,c=r&&u>1?1:0,h=r&&l>1?1:0,m=[{type:"float32",data:[c,h]},{type:"float32",data:[r?.5:0]}],f=new fl(o.shape,u,l,n);return e.runWebGPUProgram(f,[o],o.dtype,m)}const xl={kernelName:d.ResizeNearestNeighbor,backendName:"webgpu",kernelFunc:gl};class Cl{constructor(t,e){this.variableNames=["dy"],this.uniforms=`effectiveXSize : vec2<i32>, effectiveYSize : vec2<i32>, invHeightScale : f32, invWidthScale : f32,
       winHeight : i32, winWidth : i32,`,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.alignCorners=e,this.shaderKey=`resizeNearestNeigborBackprop_${e}`}getUserCode(){return`
      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getOutputCoords();
          let b = coords[0];
          let d = coords[3];
          let r = coords[1];
          let c = coords[2];

          var accumulator = 0.0;

          // Compute bounds for where in dy we will look
          let startRLerp = floor(f32(r) * uniforms.invHeightScale);
          let startDyR = i32(floor(startRLerp - f32(uniforms.winHeight / 2)));

          let startCLerp = floor(f32(c) * uniforms.invWidthScale);
          let startDyC = i32(floor(startCLerp - f32(uniforms.winWidth / 2)));

          // Loop over dy
          for (var dyROffset = 0; dyROffset < uniforms.winHeight; dyROffset++) {
            let dyR = startDyR + dyROffset;

            // Guard against the window exceeding the bounds of dy
            if (dyR < 0 || dyR >= uniforms.dyShape[1]) {
              continue;
            }

            for (var dyCOffset = 0; dyCOffset < uniforms.winWidth; dyCOffset++) {
              let dyC = startDyC + dyCOffset;

              // Guard against the window exceeding the bounds of dy
              if (dyC < 0 || dyC >= uniforms.dyShape[2]) {
                continue;
              }

              let sourceFracRow = f32(uniforms.effectiveXSize[0]) *
                  (f32(dyR) / f32(uniforms.effectiveYSize[0]));

              let sourceFracCol = f32(uniforms.effectiveXSize[1]) *
                  (f32(dyC) / f32(uniforms.effectiveYSize[1]));

              let sourceNearestRow =
                  i32(min(f32(uniforms.outShape[1] - 1),
                  ${this.alignCorners?"floor(sourceFracRow + 0.5)":"floor(sourceFracRow)"}));

              let sourceNearestCol =
                  i32(min(f32(uniforms.outShape[2] - 1),
                  ${this.alignCorners?"floor(sourceFracCol + 0.5)":"floor(sourceFracCol)"}));

              if (r == sourceNearestRow && c == sourceNearestCol) {
                accumulator += getDy(b, dyR, dyC, d);
              }
            }
          }
          // End loop over dy

          setOutputAtIndex(index, accumulator);
        }
      }
    `}}function bl(s){const{inputs:t,backend:e,attrs:i}=s,{images:o,dy:r}=t,{alignCorners:n}=i,[,a,u]=o.shape,[,l,c]=r.shape,h=[n&&l>1?a-1:a,n&&c>1?u-1:u],p=[n&&l>1?l-1:l,n&&c>1?c-1:c],m=h[0]/p[0],f=h[1]/p[1],g=1/m,x=1/f,C=Math.ceil(g)*2+2,b=Math.ceil(x)*2+2,w=new Cl(o.shape,n),I=[{type:"int32",data:h},{type:"int32",data:p},{type:"float32",data:[g]},{type:"float32",data:[x]},{type:"int32",data:[C]},{type:"int32",data:[b]}];return e.runWebGPUProgram(w,[r],r.dtype,I)}const wl={kernelName:d.ResizeNearestNeighborGrad,backendName:"webgpu",kernelFunc:bl};class Sl{constructor(t){this.variableNames=["x"],this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.uniforms=" axis : vec4<i32>,",this.shaderKey="reverse"}getUserCode(){return`
      
      // Using uniform variables as judging conditions, so the function has
      // coherent execution within all threads.
      fn getReverseCoords(coords : vec4<i32>) -> vec4<i32> {
        var reverseCoords = coords;
        if (uniforms.axis[0] == 1) {
          reverseCoords[0] = uniforms.xShape[0] - coords[0] - 1;
        }
        if (uniforms.axis[1] == 1) {
          reverseCoords[1] = uniforms.xShape[1] - coords[1] - 1;
        }
        if (uniforms.axis[2] == 1) {
          reverseCoords[2] = uniforms.xShape[2] - coords[2] - 1;
        }
        if (uniforms.axis[3] == 1) {
          reverseCoords[3] = uniforms.xShape[3] - coords[3] - 1;
        }

        return reverseCoords;
      }
    
      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getCoordsFromIndex(index);
          let reverseCoords = getReverseCoords(coords);
          setOutputAtIndex(index, getX(reverseCoords[0],
              reverseCoords[1], reverseCoords[2], reverseCoords[3]));
        }
      }
    `}}function yl(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{dims:r}=i,n=o.shape.length;if(n===0)return H({inputs:{x:o},backend:e});const a=o.shape,u=[1,1,1,1];a.forEach((x,C)=>{const b=C+4-n;u[b]=x});const l=d.util.parseAxisParam(r,o.shape),c=[0,0,0,0];l.forEach(x=>{const C=x+4-n;c[C]=1});const h=[{type:"int32",data:c}],p=P({inputs:{x:o},backend:e,attrs:{shape:u}}),m=new Sl(u),f=e.runWebGPUProgram(m,[p],p.dtype,h);e.disposeData(p.dataId);const g=P({inputs:{x:f},backend:e,attrs:{shape:a}});return e.disposeData(f.dataId),g}const vl={kernelName:d.Reverse,backendName:"webgpu",kernelFunc:yl};class Il{constructor(t,e){this.outputShape=[],this.variableNames=["x"],this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.uniforms=`centerX : f32, centerY : f32, sinRadians : f32,
          cosRadians : f32,`,this.shaderKey="rotate",this.outputShape=t,typeof e=="number"?(this.uniforms+=" fillValue : f32,",this.fillSnippet="var outputValue = uniforms.fillValue;",this.shaderKey+="_float"):(this.uniforms+=" fillValue : vec3<f32>,",this.fillSnippet="var outputValue = uniforms.fillValue[coords[3]];",this.shaderKey+="_vec3")}getUserCode(){return`
        ${y("index")} {
          if (index < uniforms.size) {
            let coords = getCoordsFromIndex(index);
            let coordXFloat = (f32(coords[2]) - uniforms.centerX) *
                uniforms.cosRadians - (f32(coords[1]) - uniforms.centerY) *
                uniforms.sinRadians;
            let coordYFloat = (f32(coords[2]) - uniforms.centerX) *
                uniforms.sinRadians + (f32(coords[1]) - uniforms.centerY) *
                uniforms.cosRadians;
            let coordX = i32(round(coordXFloat + uniforms.centerX));
            let coordY = i32(round(coordYFloat + uniforms.centerY));
            ${this.fillSnippet}
            if(coordX >= 0 && coordX < uniforms.xShape[2] && coordY >= 0 &&
                coordY < uniforms.xShape[1]) {
              outputValue = getX(coords[0], coordY, coordX, coords[3]);
            }
            setOutputAtIndex(index, outputValue);
          }
        }
      `}}const kl={kernelName:d.RotateWithOffset,backendName:"webgpu",kernelFunc:({inputs:s,attrs:t,backend:e})=>{const{image:i}=s,{radians:o,fillValue:r,center:n}=t,a=e,u=new Il(i.shape,r),[l,c]=d.backend_util.getImageCenter(n,i.shape[1],i.shape[2]),h=[{type:"float32",data:[l]},{type:"float32",data:[c]},{type:"float32",data:[Math.sin(o)]},{type:"float32",data:[Math.cos(o)]}];return typeof r=="number"?h.push({type:"float32",data:[Number.parseFloat(r.toFixed(2))]}):h.push({type:"float32",data:r}),a.runWebGPUProgram(u,[i],i.dtype,h)}};const Rl=_({opType:S.ROUND}),Pl={kernelName:d.Round,backendName:"webgpu",kernelFunc:Rl};const $l=_({opType:S.RSQRT,cpuKernelImpl:Ui}),Dl={kernelName:d.Rsqrt,backendName:"webgpu",kernelFunc:$l};class xe{constructor(t,e,i,o,r,n,a,u=!0){this.variableNames=["updates","indices"],this.workgroupSize=[64,1,1],this.atomic=!0,this.outputShape=n,this.type=a,this.sumDupeIndices=u,this.dispatchLayout=R(t),this.dispatch=v(this.dispatchLayout,t,this.workgroupSize),this.sliceDimGreaterThanOne=e>1,this.shaderKey=`scatter_${i}_${o}_${this.sliceDimGreaterThanOne}_${a}_${u}_${r.length}`;const l=L(r.length);this.uniforms=`sliceDim : i32, strides: ${l}, updatesSize: i32,`,this.updatesRank=o,this.indicesRank=i}getUserCode(){let t="";this.indicesRank===1?t="coords[0]":this.indicesRank===2&&(t="coords[0], j");const e=`getIndices(${t})`,i=this.sliceDimGreaterThanOne?"uniforms.strides[j]":"uniforms.strides";let o="",r="";this.dispatchLayout.x.length===1?(o="flattenedIndex",r=`
      fn getUpdatesCoordsFromFlatIndex(index : i32) -> i32 {
        return index;
      }
      `):this.dispatchLayout.x.length===2&&(o="vec2<i32>(flattenedIndex, coords[1])",r=`
      fn getUpdatesCoordsFromFlatIndex(index : i32) -> vec2<i32> {
        // N.B. |updates| could be a scalar tensor, conceptually representing a
        // 2D tensor with all values equal to that. By design, its size must be
        // the same as |outShape[1]| in one dimension, and |indicesShape[0]|
        // gives the other.
        let sliceSize = uniforms.outShape[1];
        let d0 = index / sliceSize;
        let d1 = index - d0 * sliceSize;
        return vec2<i32>(d0, d1);
      }
      `);const a=`getUpdates(${Array.from({length:this.updatesRank},(l,c)=>`coords[${c}]`).join(", ")})`;return`
    ${r}
      ${y("index")} {
        if (index < uniforms.updatesSize) {
          let coords = getUpdatesCoordsFromFlatIndex(index);
          var flattenedIndex = 0;
          for (var j = 0; j < uniforms.sliceDim; j = j + 1) {
            let indexInside = i32(round(${e}));
            flattenedIndex = flattenedIndex + indexInside * ${i};
          }
          let updateValue =
              ${J(this.type)}(${a});
          let flatIndex = getOutputIndexFromCoords(${o});

          ${this.sumDupeIndices?Z("&result[flatIndex]","updateValue",this.type):"atomicStore(&result[flatIndex], bitcast<i32>(updateValue));"}
        }
      }`}}function Nl(s){const{inputs:t,backend:e,attrs:i}=s,{indices:o,updates:r}=t,{shape:n}=i,{sliceRank:a,numUpdates:u,sliceSize:l,strides:c,outputSize:h}=d.backend_util.calculateShapes(r,o,n),p=[h/l,l];if(h===0)return e.makeTensorInfo(n,o.dtype);const m=P({inputs:{x:o},backend:e,attrs:{shape:[u,a]}}),f=P({inputs:{x:r},backend:e,attrs:{shape:[u,l]}}),g=f.dtype,x=G({backend:e,attrs:{shape:p,value:0,dtype:g}}),C=d.util.sizeFromShape(f.shape),b=[{type:"int32",data:[a]},{type:"int32",data:c},{type:"int32",data:[C]}],w=new xe(f.shape,a,m.shape.length,f.shape.length,c,p,g),I=e.runWebGPUProgram(w,[f,m],g,b,x),k=P({inputs:{x:I},backend:e,attrs:{shape:n}});return e.disposeData(m.dataId),e.disposeData(f.dataId),e.disposeData(I.dataId),k}const zl={kernelName:d.ScatterNd,backendName:"webgpu",kernelFunc:Nl};class Al{constructor(t,e){this.outputShape=[],this.variableNames=["sortedSequence","values"],this.uniforms="numInputs : i32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.side=e,this.shaderKey=`search_sorted_${e}`}getUserCode(){return`
      fn findBound(batch: i32, value: f32) -> i32 {
        var left = i32(0);
        var right = uniforms.numInputs;
        while (left < right) {
          var mid = (left + right) / 2;
          if (getSortedSequence(batch, mid) ${this.side==="left"?"<":"<="} value) {
            left = mid + 1;
          } else {
            right = mid;
          }
        }
        return right;
      }

      ${y("index")} {
        if (index < uniforms.size) {
          let coords = getCoordsFromIndex(index);
          let value = getValuesByOutputIndex(index);
          setOutputAtIndexI32(index, findBound(coords[0], value));
        }
      }
    `}}function Fl(s){const{inputs:t,backend:e,attrs:i}=s,{sortedSequence:o,values:r}=t,{side:n}=i,a=new Al([r.shape[0],r.shape[1]],n),u=[{type:"int32",data:[o.shape[1]]}];return e.runWebGPUProgram(a,[o,r],"int32",u)}const _l={kernelName:d.SearchSorted,backendName:"webgpu",kernelFunc:Fl};class Ll{constructor(t,e,i){this.variableNames=["c","a","b"],this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=e,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.cRank=t,this.rank=i,this.shaderKey="select"}getUserCode(){let t,e;if(this.rank>4)throw Error(`Where for rank ${this.rank} is not yet supported`);if(this.rank===1)e="resRC",t="resRC";else{const o=["resRC.x","resRC.y","resRC.z","resRC.w"],r=[],n=[];for(let a=0;a<this.outputShape.length;a++)n.push(`${o[a]}`),a<this.cRank&&r.push(`${o[a]}`);t=r.join(),e=n.join()}return`
      ${y("index")} {
        if (index < uniforms.size) {
          let resRC = getCoordsFromIndex(index);
          let cVal = getC(${t});
          if (cVal >= 1.0) {
            setOutputAtIndex(index, getA(${e}));
          } else {
            setOutputAtIndex(index, getB(${e}));
          }
        }
      }
    `}}function El(s){const{inputs:t,backend:e}=s,{condition:i,t:o,e:r}=t,n=new Ll(i.shape.length,o.shape,o.shape.length);return e.runWebGPUProgram(n,[i,o,r],d.upcastType(o.dtype,r.dtype))}const Tl={kernelName:d.Select,backendName:"webgpu",kernelFunc:El};const Bl=_({opType:S.SELU}),Wl={kernelName:d.Selu,backendName:"webgpu",kernelFunc:Bl};const Ml=_({opType:S.SIGMOID}),Vl={kernelName:d.Sigmoid,backendName:"webgpu",kernelFunc:Ml};const Ul=_({opType:S.SIGN}),Ol={kernelName:d.Sign,backendName:"webgpu",kernelFunc:Ul};const Gl=_({opType:S.SIN}),Hl={kernelName:d.Sin,backendName:"webgpu",kernelFunc:Gl};const Xl=_({opType:S.SINH}),Kl={kernelName:d.Sinh,backendName:"webgpu",kernelFunc:Xl};const ql=_({opType:S.SOFTPLUS}),Yl={kernelName:d.Softplus,backendName:"webgpu",kernelFunc:ql};class jl{constructor(t,e,i,o,r,n){this.variableNames=["x"],this.outputShape=[],this.uniforms="",this.workgroupSize=[64,1,1],this.size=!0;const a=new Array(o.length);for(let u=0;u<a.length;u++)a[u]=o[r[u]];this.outputShape=a,this.newDim=r,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.xShape=t,this.paddedXShape=e,this.uniforms+=`reshapedPaddedXShape : ${L(o.length)}, paddedXShapeStrides : ${L(n)}, `,i.map((u,l)=>{this.uniforms+=` pad${l} : vec2<i32>,`}),this.shaderKey=`spaceToBatchND_${r}`}getUserCode(){const t=L(this.outputShape.length),e=st(this.newDim);return`
      ${we(this.paddedXShape,"PaddedX")}
      ${y("index")} {
        if(index < uniforms.size) {
          let coords = getCoordsFromIndex(index);
          let switchedIndex = getIndexFromCoords${this.outputShape.length}D(${t}(${e}), uniforms.reshapedPaddedXShape);
          let paddedCoords = getPaddedXCoordsFromIndex(switchedIndex);
          ${Rt(this.xShape,!0)}
        }
      }
    `}}const Ql=s=>{const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{blockShape:r,paddings:n}=i;d.util.assert(o.shape.length<=4,()=>"spaceToBatchND for rank > 4 with a WebGPU backend not implemented yet");const a=r.reduce((b,w)=>b*w),u=[[0,0]];u.push(...n);for(let b=1+r.length;b<o.shape.length;++b)u.push([0,0]);const l=u.map((b,w)=>b[0]+o.shape[w]+b[1]),c=d.backend_util.getReshaped(l,r,a,!1),h=d.backend_util.getPermuted(c.length,r.length,!1),p=d.backend_util.getReshapedPermuted(l,r,a,!1),m=d.util.computeStrides(l),f=new jl(o.shape,l,u,c,h,m.length),g=[{type:"int32",data:c},{type:"int32",data:m}];u.map(b=>g.push({type:"int32",data:[b[0],b[1]]}));const x=e.runWebGPUProgram(f,[o],o.dtype,g),C=P({inputs:{x},backend:e,attrs:{shape:p}});return e.disposeData(x.dataId),C},Zl={kernelName:d.SpaceToBatchND,backendName:"webgpu",kernelFunc:Ql};class Jl{constructor(t,e,i){this.variableNames=["input","indices","segmentIds"],this.outputShape=[],this.uniforms="segmentSize : i32, sparseSize : i32,",this.workgroupSize=[64,1,1],this.atomic=!0,this.outputShape=t,this.type=i,this.dispatchLayout=R([e]),this.dispatch=v(this.dispatchLayout,[e],this.workgroupSize),this.shaderKey="sparseSegmentSum"}getUserCode(){return`
    ${y("index")} {
      if (index < uniforms.sparseSize) {
        let indexInSegmentIds = index / uniforms.segmentSize;
        let indexInSegment = index % uniforms.segmentSize;
        let indexInInput = indices[indexInSegmentIds];
        let segmentId = segmentIds[indexInSegmentIds];

        let value = input[indexInInput * uniforms.segmentSize + indexInSegment];
        let outIndex = segmentId * uniforms.segmentSize + indexInSegment;
        ${Z("&result[outIndex]","value",this.type)}
      }
    }
  `}}class ec{constructor(t,e){this.variableNames=["segmentIds"],this.outputShape=[],this.workgroupSize=[64,1,1],this.atomic=!0,this.outputShape=[t],this.dispatchLayout=R(e),this.dispatch=v(this.dispatchLayout,e,this.workgroupSize),this.shaderKey="sparseSegmentIdCountProgram"}getUserCode(){return`
    ${y("index")} {
      if (index < uniforms.segmentIdsShape) {
        let segmentId = segmentIds[index];
        ${Z("&result[segmentId]","1","int32")}
      }
    }
  `}}class tc{constructor(t,e){this.variableNames=["segmentSum","sameSegmentIdCount"],this.outputShape=[],this.uniforms="segmentSize : i32",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.type=e,this.dispatchLayout=R(t),this.dispatch=v(this.dispatchLayout,t,this.workgroupSize),this.shaderKey="sparseSegmentMean"}getUserCode(){return`
    ${y("index")} {
      if (index < uniforms.size) {
        let segmentId = index / uniforms.segmentSize;
        let count = sameSegmentIdCount[segmentId];
        if (count != 0) {
          ${this.type==="float32"?"setOutputAtIndex(index, segmentSum[index] / f32(count));":"setOutputAtIndexI32(index, segmentSum[index] / count);"}
        }
      }
    }
  `}}function Pt(s,t,e,i=!1,o){const n=d.util.sizeFromShape(s.shape)/s.shape[0],a=s.dtype,u=d.util.sizeFromShape(t.shape),l=o.readSync(e.dataId),h=u>0?l[u-1]+1:0;let p;const m=s.shape.slice();m[0]=h;const f=u*n,g=G({backend:o,attrs:{shape:m,value:0,dtype:a}});p=new Jl(m,f,a);let x=[{type:"int32",data:[n]},{type:"int32",data:[f]}];const C=o.runWebGPUProgram(p,[s,t,e],a,x,g);if(i)return C;const b=G({backend:o,attrs:{shape:[h],value:0,dtype:"int32"}});p=new ec(h,e.shape);const w=o.runWebGPUProgram(p,[e],"int32",null,b),I=G({backend:o,attrs:{shape:m,value:0,dtype:a}});p=new tc(m,a),x=[{type:"int32",data:[n]}];const k=o.runWebGPUProgram(p,[C,w],a,x,I);return o.disposeData(C.dataId),o.disposeData(w.dataId),k}function sc(s){const{inputs:t,backend:e}=s,{data:i,indices:o,segmentIds:r}=t;return Pt(i,o,r,!1,e)}const oc={kernelName:d.SparseSegmentMean,backendName:"webgpu",kernelFunc:sc};function ic(s){const{inputs:t,backend:e}=s,{data:i,indices:o,segmentIds:r}=t;return Pt(i,o,r,!0,e)}const rc={kernelName:d.SparseSegmentSum,backendName:"webgpu",kernelFunc:ic};class nc{constructor(t,e){this.variableNames=["A"],this.workgroupSize=[64,1,1],this.size=!0;const i=new Array(t.length);for(let o=0;o<i.length;o++)i[o]=t[o]*e[o];this.outputShape=i,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.rank=this.outputShape.length,this.shaderKey="tile"}getUserCode(){const t=ac(this.rank,"uniforms.");return`
      ${y("index")} {
        if (index < uniforms.size) {
          let resRC = getCoordsFromIndex(index);
          setOutputAtIndex(index, getA(${t}));
        }
      }
    `}}function ac(s,t=""){if(s>=5)throw Error(`Tile for rank ${s} is not yet supported`);if(s===1)return`(resRC % ${t}aShape)`;const e=["resRC.x","resRC.y","resRC.z","resRC.w"],i=[];for(let o=0;o<s;o++)i.push(`(${e[o]} % ${t}aShape[${o}])`);return i.join()}function Ue(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{reps:r}=i;if(e.shouldExecuteOnCPU([o])||o.dtype==="string"||o.shape.length>=5){const u=e.readSync(o.dataId),l=o.dtype==="string"?u.map(p=>d.util.decodeString(p)):u,c=d.buffer(o.shape,o.dtype,l),h=Yi(c,r);return e.makeTensorInfo(h.shape,h.dtype,h.values)}const n=new nc(o.shape,r);return e.runWebGPUProgram(n,[o],o.dtype)}const uc={kernelName:d.Tile,backendName:"webgpu",kernelFunc:Ue};function dc(s){const{inputs:t,backend:e,attrs:i}=s,{sparseIndices:o,sparseValues:r,defaultValue:n}=t,{outputShape:a}=i,{sliceRank:u,numUpdates:l,sliceSize:c,strides:h,outputSize:p}=d.backend_util.calculateShapes(r,o,a),m=!1;if(r.dtype==="string"){const F=e.bufferSync(o),A=e.bufferSync(r),E=d.util.decodeString(e.readSync(n.dataId)[0]),T=Oi(F,A,a,p,c,l,u,h,E,m);return e.makeTensorInfo(a,T.dtype,T.values)}const f=[p/c,c],g=P({inputs:{x:o},backend:e,attrs:{shape:[l,u]}}),x=r.shape.length?P({inputs:{x:r},backend:e,attrs:{shape:[l,c]}}):H({inputs:{x:r},backend:e}),C=x.dtype,b=e.makeTensorInfo([],C,d.util.makeZerosTypedArray(1,C)),w=P({inputs:{x:n},backend:e,attrs:{shape:Array(f.length).fill(1)}}),I=Ue({inputs:{x:w},backend:e,attrs:{reps:f}}),k=d.util.sizeFromShape([l,c]),$=[{type:"int32",data:[u]},{type:"int32",data:h},{type:"int32",data:[k]}];switch(l){case 0:break;case 1:{const F=new xe([l,c],u,g.shape.length,x.shape.length,h,f,C,m);e.runWebGPUProgram(F,[x,g],C,$,I)}break;default:{const F=new xe([l,c],u,g.shape.length,b.shape.length,h,f,C,m);e.runWebGPUProgram(F,[b,g],C,$,I)}{const F=new xe([l,c],u,g.shape.length,x.shape.length,h,f,C);e.runWebGPUProgram(F,[x,g],C,$,I)}}const D=P({inputs:{x:I},backend:e,attrs:{shape:a}});return e.disposeData(g.dataId),e.disposeData(x.dataId),e.disposeData(w.dataId),e.disposeData(b.dataId),e.disposeData(I.dataId),D}const lc={kernelName:d.SparseToDense,backendName:"webgpu",kernelFunc:dc};function cc(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{numOrSizeSplits:r,axis:n}=i,a=d.util.parseAxisParam(n,o.shape)[0],u=d.backend_util.prepareSplitSize(o,r,a),l=o.shape.length,c=new Array(l).fill(0),h=o.shape.slice();return u.map(p=>{const m=[...h];m[a]=p;const f=ue({inputs:{x:o},backend:e,attrs:{begin:c,size:m}});return c[a]+=p,f})}const hc={kernelName:d.SplitV,backendName:"webgpu",kernelFunc:cc};const pc=_({opType:S.SQRT}),mc={kernelName:d.Sqrt,backendName:"webgpu",kernelFunc:pc};const fc={kernelName:d.Square,backendName:"webgpu",kernelFunc:({inputs:s,backend:t})=>{const{x:e}=s,i=t,o=new ne(e.shape,S.SQUARE);return i.runWebGPUProgram(o,[e],e.dtype)}};const gc=W({opType:N.SQUARED_DIFFERENCE}),xc={kernelName:d.SquaredDifference,backendName:"webgpu",kernelFunc:gc};function Cc({inputs:s,attrs:t,backend:e}){const{x:i}=s,o=new ne(i.shape,S.STEP,"stepAlpha : f32,"),r=[{type:"float32",data:[t.alpha]}];return e.runWebGPUProgram(o,[i],i.dtype,r)}const bc={kernelName:d.Step,backendName:"webgpu",kernelFunc:Cc};class wc{constructor(t){this.variableNames=["x"],this.workPerThread=1,this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize,[this.workPerThread,1,1]);const e=L(this.outputShape.length);this.uniforms=`begin : ${e},  strides : ${e}, `,this.shaderKey="stridedSlice"}getUserCode(){const t=this.outputShape.length;let e="";if(t===1)e="coords * uniforms.strides + uniforms.begin";else{let o=0;e=this.outputShape.map((r,n)=>(o++,this.outputShape.length===1?`coords * uniforms.strides[${n}] + uniforms.begin[${n}]`:`coords[${o-1}] * uniforms.strides[${n}] + uniforms.begin[${n}]`)).join(",")}return`
       ${y("index")} {
         if (index < uniforms.size) {
           let coords = getCoordsFromIndex(index);
           setOutputAtIndex(index, getX(${e}));
         }
       }
     `}}function Sc(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{begin:r,end:n,strides:a,beginMask:u,endMask:l,ellipsisMask:c,newAxisMask:h,shrinkAxisMask:p}=i,{finalShapeSparse:m,finalShape:f,isIdentity:g,sliceDim0:x,isSimpleSlice:C,begin:b,end:w,strides:I}=d.slice_util.sliceInfo(o.shape,r,n,a,u,l,c,h,p);let k;if(g)k=P({inputs:{x:o},backend:e,attrs:{shape:f}});else if(x||C){d.util.assert(o.shape.length>=1,()=>`Input must have rank at least 1, got: ${o.shape.length}`);const $=d.slice_util.computeOutShape(b,w,I),D=ue({inputs:{x:o},backend:e,attrs:{begin:b,size:$}});k=P({inputs:{x:D},backend:e,attrs:{shape:f}}),e.disposeData(D.dataId)}else if(e.shouldExecuteOnCPU([o])){const D=e.readSync(o.dataId),F=d.buffer(o.shape,o.dtype,D),A=Xi(m,F,I,b);k=e.makeTensorInfo(f,o.dtype,A.values)}else{const D=new wc(m),F=[{type:"int32",data:b},{type:"int32",data:I}],A=e.runWebGPUProgram(D,[o],o.dtype,F);k=P({inputs:{x:A},backend:e,attrs:{shape:f}}),e.disposeData(A.dataId)}return k}const yc={kernelName:d.StridedSlice,backendName:"webgpu",kernelFunc:Sc};function vc(s){const{inputs:t,backend:e,attrs:i}=s,{separator:o,nGramWidths:r,leftPad:n,rightPad:a,padWidth:u,preserveShortSequences:l}=i,{data:c,dataSplits:h}=t,p=e.readSync(c.dataId),m=e.readSync(h.dataId),[f,g]=Ki(p,m,o,r,n,a,u,l);return[e.makeTensorInfo([f.length],"string",f),e.makeTensorInfo(h.shape,"int32",g)]}const Ic={kernelName:d.StringNGrams,backendName:"webgpu",kernelFunc:vc};const kc=W({opType:N.SUB,cpuKernelImpl:qi,supportsComplex:!0}),Rc={kernelName:d.Sub,backendName:"webgpu",kernelFunc:kc};const Pc=_({opType:S.TAN}),$c={kernelName:d.Tan,backendName:"webgpu",kernelFunc:Pc};const Dc=_({opType:S.TANH}),Nc={kernelName:d.Tanh,backendName:"webgpu",kernelFunc:Dc};function zc(s){const{inputs:t,backend:e,attrs:i}=s,{tensor:o,indices:r,updates:n}=t,{sliceRank:a,numUpdates:u,sliceSize:l,strides:c,outputSize:h}=d.backend_util.calculateShapes(n,r,o.shape),p=[h/l,l];if(h===0)return e.makeTensorInfo(o.shape,r.dtype);const m=[],f=P({inputs:{x:r},backend:e,attrs:{shape:[u,a]}});m.push(f);const g=P({inputs:{x:n},backend:e,attrs:{shape:[u,l]}});m.push(g);const x=P({inputs:{x:o},backend:e,attrs:{shape:p}});m.push(x);const C=Ue({inputs:{x},backend:e,attrs:{reps:Array(p.length).fill(1)}}),b=new xe([u,l],a,f.shape.length,g.shape.length,c,p,o.dtype,!1),w=d.util.sizeFromShape([u,l]),I=[{type:"int32",data:[a]},{type:"int32",data:c},{type:"int32",data:[w]}],k=e.runWebGPUProgram(b,[g,f],x.dtype,I,C);m.push(k);const $=P({inputs:{x:k},backend:e,attrs:{shape:o.shape}});return m.forEach(D=>e.disposeData(D.dataId)),$}const Ac={kernelName:d.TensorScatterUpdate,backendName:"webgpu",kernelFunc:zc};class Fc{constructor(t){this.variableNames=["x","indices"],this.workgroupSize=[256,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.uniforms=`inputSize : i32, firstPass : i32, negativeInf : f32,
        dir : i32, inc : i32,`,this.shaderKey="swap"}getUserCode(){return`
        ${y("index")} {
          if (index < uniforms.size) {
            let outC = getCoordsFromIndex(index);
            let batch = outC[0];
            let elemIdx = outC[1];
            // We compare elements pair-wise within a group of size 2 * inc.
            // The comparing rule for each group alternates between ascending
            // and descending. Within each group, we compare each pair at
            // positions i and i+inc. To decide whether an element at position i
            // is x0 or x1, we mod it by 2 * inc, if the result is smaller than
            // inc, it is in the first half of the group, we denote it as x0,
            // otherwise we denote it as x1.
            // For example, as shown in the Bitonic top K paper referenced
            // above, Figure5(a) shows that element[1] is in the second half of
            // the group when group size is 2, but it is in the first half of
            // the group when group size is 4.
            let isFirstInPair = elemIdx % (2 * uniforms.inc) < uniforms.inc;
            var i = 0;
            if (isFirstInPair) {
              i = elemIdx;
            } else {
              i = elemIdx - uniforms.inc;
            }

            var i0 = 0;
            if (uniforms.firstPass == 1) {
              i0 = i;
            } else {
              i0 = i32(getIndices(batch, i));
            }

            var i1 = 0;
            if (uniforms.firstPass == 1) {
              i1 = i + uniforms.inc;
            } else {
              i1 = i32(getIndices(batch, i + uniforms.inc));
            }

            var x0 = f32(0.0);
            var x1 = f32(0.0);
            if (i0 < uniforms.inputSize) {
              x0 = getX(batch, i0);
            } else {
              x0 = uniforms.negativeInf;
            }
            if (i1 < uniforms.inputSize) {
              x1 = getX(batch, i1);
            } else {
              x1 = uniforms.negativeInf;
            }

            let reverse = elemIdx % (2 * uniforms.dir) >= uniforms.dir;
            let isGreater = x0 > x1 || (x0 == x1 && i1 > i0);
            if (reverse == isGreater) {
              // Elements in opposite order of direction
              let iTemp = i0;
              i0 = i1;
              i1 = iTemp;
            }
            if (isFirstInPair) {
              setOutputAtIndex(index, f32(i0));
            } else {
              setOutputAtIndex(index, f32(i1));
            }
          }
        }
      `}}class _c{constructor(t){this.variableNames=["x","indices"],this.workgroupSize=[256,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.uniforms="inputSize : i32, firstPass : i32, k : i32,",this.shaderKey="merge"}getUserCode(){return`
        ${y("index")} {
          if (index < uniforms.size) {
            let outC = getCoordsFromIndex(index);
            let batch = outC[0];
            let elemIdx = outC[1];
            // The output size is half of the previous size.
            // If the previous sequence is | | | | _ _ _ _  | | | |  _ _ _ _
            // (k=4), we only need to output the indices at positions |, the
            // indices at positions _ can be thrown away, see Figure5(b) After
            // Phase 2 (Merge phase) in the Bitonic Top K paper referenced
            // above.
            // For example, the paper shows we only need to output the orange
            // bars. The output sequence should look like this | | | | | | | |.
            // Because the sequence is halved, to map the output index back to
            // the previous sequence to find the corresponding value, we need
            // to double the index. When we double the index, we basically
            // interpolate a position, so 2i looks like
            // | _ | _ | _ | _ | _ | _ | _. We move the | to the first k
            // position of each 2k positions by - elemIdx % k. E.g. for output
            // at index 4,5,6,7, we want to get the corresponding element at
            // original index 8,9,10,11, for output at index 8,9,10,11,
            // we want to get the corresponding element at original index
            // 16,17,18,19, so on and so forth.

            var i = 0;
            if (elemIdx < uniforms.k) {
              i = elemIdx;
            } else {
              i = elemIdx * 2 - elemIdx % uniforms.k;
            }
            var i0 = 0;
            if (uniforms.firstPass == 1) {
              i0 = i;
            } else {
              i0 = i32(getIndices(batch, i));
            }
            var i1 = 0;
            if (uniforms.firstPass == 1) {
              i1 = i + uniforms.k;
            } else {
              i1 = i32(getIndices(batch, i + uniforms.k));
            }

            let x0 = getX(batch, i0);
            var x1 = f32(0.0);
            if (i1 < uniforms.inputSize) {
              x1 = getX(batch, i1);
            } else {
              x1 = x0;
            }

            if (x0 >= x1) {
              setOutputAtIndex(index, f32(i0));
            } else {
              setOutputAtIndex(index, f32(i1));
            }
          }
        }
      `}}function le(s,t){t!==null&&s.disposeData(t.dataId)}function $t(s){let t=1;for(;t<s;)t*=2;return t}function Lc(s){const{inputs:t,backend:e,attrs:i}=s,{x:o}=t,{k:r,sorted:n}=i,a=o.shape,u=a[a.length-1];if(e.shouldExecuteOnCPU([o])){const k=e.readSync(o.dataId),[$,D]=ji(k,a,o.dtype,r,n);return[e.makeTensorInfo($.shape,$.dtype,$.values),e.makeTensorInfo(D.shape,D.dtype,D.values)]}if(r===0)return a[a.length-1]=0,[e.makeTensorInfo(a,o.dtype,[]),e.makeTensorInfo(a,"int32",[])];if(u===1)return[o,G({attrs:{shape:a,dtype:"int32",value:0},backend:e})];const c=d.util.sizeFromShape(a)/u,h=P({inputs:{x:o},attrs:{shape:[c,u]},backend:e}),p=$t(r),m=$t(u);let f=null;const g=()=>f===null?[h,h]:[h,f],x=(k,$,D)=>{const F=g(),A=new Fc(D),T=[{type:"int32",data:[u]},{type:"int32",data:[f===null?1:0]},{type:"float32",data:[Number.NEGATIVE_INFINITY]},{type:"int32",data:[k]},{type:"int32",data:[$]}],O=f;f=e.runWebGPUProgram(A,F,"int32",T),le(e,O)};for(let k=1;k<p;k*=2){const $=k*2;for(let D=k;D>=1;D/=2)x($,D,[c,m])}for(let k=m;k>p;k/=2){const $=g(),D=new _c([c,k/2]),A=[{type:"int32",data:[u]},{type:"int32",data:[f===null?1:0]},{type:"int32",data:[p]}],E=f;f=e.runWebGPUProgram(D,$,"int32",A),le(e,E);const T=p/2,O=T*2;for(let V=T;V>=1;V/=2)x(O,V,f.shape)}let C=f;f=ue({inputs:{x:f},backend:e,attrs:{begin:0,size:[c,r]}}),le(e,C);let b=yt({inputs:{x:h,indices:f},backend:e,attrs:{axis:1,batchDims:1}});le(e,h);const w=a.slice(0,-1);w.push(r),C=f,f=P({inputs:{x:f},attrs:{shape:w},backend:e}),le(e,C);const I=b;return b=P({inputs:{x:b},attrs:{shape:w},backend:e}),le(e,I),[b,f]}const Ec={kernelName:d.TopK,backendName:"webgpu",kernelFunc:Lc};class Tc{constructor(t){this.variableNames=["Image","Transforms"],this.uniforms="interpolationModeId : i32, fillModeId : i32, fillValue : f32,",this.workgroupSize=[64,1,1],this.size=!0,this.outputShape=t,this.dispatchLayout=R(this.outputShape),this.dispatch=v(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="transform"}getUserCode(){return`
          fn mapCoord(outCoord : f32, len : f32) -> f32{
            var inCoord = outCoord;
            if(uniforms.fillModeId == 2) {
              if (inCoord < 0.0) {
                if (len <= 1.0) {
                  inCoord = 0.0;
                } else {
                  let sz2 = 2.0 * len;
                  if (inCoord < sz2) {
                    inCoord = sz2 * f32(i32(f32(-inCoord / sz2))) +
                    inCoord;
                  }
                  if (inCoord < -len) {
                    inCoord = inCoord + sz2;
                  } else {
                    inCoord = -inCoord - 1.0;
                  }
                }
              } else if (inCoord > len - 1.0) {
                if (len <= 1.0) {
                  inCoord = 0.0;
                } else {
                  let sz2 = 2.0 * len;
                  inCoord = inCoord - sz2 * f32(i32(f32(inCoord / sz2)));
                  if (inCoord >= len) {
                    inCoord = sz2 - inCoord - 1.0;
                  }
                }
              }
              return clamp(inCoord, 0.0, len - 1.0);
            } else if (uniforms.fillModeId == 3) {
              if (inCoord < 0.0) {
                if (len <= 1.0) {
                  inCoord = 0.0;
                } else {
                  let sz = len - 1.0;
                  inCoord = inCoord + len * (f32(i32(f32(-inCoord / sz))) + 1.0);
                }
              } else if (inCoord > len - 1.0) {
                if (len <= 1.0) {
                  inCoord = 0.0;
                } else {
                  let sz = len - 1.0;
                  inCoord = inCoord - len * f32(i32(f32(inCoord / sz)));
                }
              }
              return clamp(inCoord, 0.0, len - 1.0);
            } else if (uniforms.fillModeId == 4) {
              return clamp(outCoord, 0.0, len - 1.0);
            }
            return outCoord;
          }
          fn readWithFillValue(batch : i32, coordY : i32, coordX : i32,
            channel : i32) -> f32 {
            var outputValue : f32;
            if (0 <= coordY && coordY < uniforms.imageShape[1] && 0 <= coordX && coordX < uniforms.imageShape[2]) {
                outputValue = getImage(batch, coordY, coordX, channel);
            } else {
              outputValue = uniforms.fillValue;
            }
            return outputValue;
          }

          ${y("index")} {
            if (index < uniforms.size) {
              let coords = getCoordsFromIndex(index);
              var outputValue : f32;
              let batch = coords[0];
              let x = coords[2];
              let y = coords[1];
              let channel = coords[3];
              let xf = f32(x);
              let yf = f32(y);
              let a1 = getTransforms(batch, 0);
              let a2 = getTransforms(batch, 1);
              let a3 = getTransforms(batch, 2);
              let b1 = getTransforms(batch, 3);
              let b2 = getTransforms(batch, 4);
              let b3 = getTransforms(batch, 5);
              let c1 = getTransforms(batch, 6);
              let c2 = getTransforms(batch, 7);
              let projection = c1 * xf + c2 * yf + 1.0;
              if (projection == 0.0) {
                outputValue = uniforms.fillValue;
              } else {
                let inX = (a1 * xf + a2 * yf + a3) / projection;
                let inY = (b1 * xf + b2 * yf + b3) / projection;
                let mapX = mapCoord(inX, f32(uniforms.imageShape[2]));
                let mapY = mapCoord(inY, f32(uniforms.imageShape[1]));

                if (uniforms.interpolationModeId == 1) {
                  let coordY = i32(round(mapY));
                  let coordX = i32(round(mapX));
                  outputValue = readWithFillValue(batch, coordY, coordX,
                    channel);
                } else {
                  let yFloor = floor(mapY);
                  let xFloor = floor(mapX);
                  let yCeil = yFloor + 1.0;
                  let xCeil = xFloor + 1.0;
                  let valueYFloor = (xCeil - mapX) *
                  readWithFillValue(batch, i32(yFloor), i32(xFloor), channel) +
                  (mapX - xFloor) *
                  readWithFillValue(batch, i32(yFloor), i32(xCeil), channel);
                  let valueYCeil = (xCeil - mapX) *
                  readWithFillValue(batch, i32(yCeil), i32(xFloor), channel) +
                  (mapX - xFloor) *
                  readWithFillValue(batch, i32(yCeil), i32(xCeil), channel);
                  outputValue = (yCeil - mapY) * valueYFloor +
                  (mapY - yFloor) * valueYCeil;
                }
              }
              setOutputAtIndex(index, outputValue);
            }
          }
        `}}function Bc(s){const{inputs:t,backend:e,attrs:i}=s,{image:o,transforms:r}=t,{interpolation:n,fillMode:a,fillValue:u,outputShape:l}=i,[c,h,p,m]=o.shape,[f,g]=l??[h,p],x=[c,f,g,m],C=new Tc(x),b=n==="nearest"?1:2;let w;switch(a){case"constant":w=1;break;case"reflect":w=2;break;case"wrap":w=3;break;case"nearest":w=4;break;default:w=1;break}const I=[{type:"int32",data:[b]},{type:"int32",data:[w]},{type:"float32",data:[u]}];return e.runWebGPUProgram(C,[o,r],"float32",I)}const Wc={kernelName:d.Transform,backendName:"webgpu",kernelFunc:Bc};function Mc(s){const{inputs:t,backend:e,attrs:i}=s,{value:o}=t;let{axis:r}=i;r<0&&(r+=o.shape.length);const n=o,a=n.shape.length,u=o.shape[r],l=new Array(a-1);let c=0;for(let g=0;g<a;g++)g!==r&&(l[c++]=n.shape[g]);const h=[],p=new Array(a).fill(0),m=n.shape.slice();m[r]=1;const f=new Array(u);for(let g=0;g<f.length;g++){p[r]=g;const x=ue({inputs:{x:n},backend:e,attrs:{begin:p,size:m}}),C=P({inputs:{x},backend:e,attrs:{shape:l}});f[g]=C,h.push(x)}return h.forEach(g=>e.disposeData(g.dataId)),f}const Vc={kernelName:d.Unpack,backendName:"webgpu",kernelFunc:Mc};class Uc{constructor(t,e,i){if(this.outputShape=[],this.variableNames=["x","segmentIds"],this.uniforms="numSegments : i32, xSize: i32,",this.workgroupSize=[64,1,1],this.atomic=!0,this.outputShape=e,this.dispatchLayout=R(t),this.dispatch=v(this.dispatchLayout,t,this.workgroupSize),i!=="float32"&&i!=="int32")throw new Error(`UnsortedSegmentSum only supports float32 and int32
              types, does not support ${i} type.`);this.type=i,this.shaderKey="unsortedSegmentSum"}getUserCode(){return`
    ${y("index")} {
      if (index < uniforms.xSize) {
        let coords = getXCoordsFromIndex(index);
        let b = coords[0];
        let inCol = coords[1];

        let segmentId = i32(getSegmentIds(inCol));
        if (segmentId >= 0) {
          let flatIndex = b * uniforms.numSegments + segmentId % uniforms.numSegments;
          let value = getX(b, inCol);

          ${Z("&result[flatIndex]","value",this.type)}
        }
      }
    }
  `}}function Oc(s){const{inputs:t,backend:e,attrs:i}=s,{x:o,segmentIds:r}=t,{numSegments:n}=i,a=o.shape.length,u=[];let l=0;const c=d.backend_util.getAxesPermutation([l],a);let h=o;c!=null&&(h=Y({inputs:{x:o},backend:e,attrs:{perm:c}}),u.push(h),l=d.backend_util.getInnerMostAxes(1,a)[0]);const p=d.backend_util.segment_util.computeOutShape(h.shape,l,n),m=d.util.sizeFromShape([h.shape[l]]),f=P({inputs:{x:h},backend:e,attrs:{shape:[-1,m]}});u.push(f);const g=o.dtype,x=[f.shape[0],n],C=G({backend:e,attrs:{shape:x,value:0,dtype:g}}),b=new Uc(f.shape,x,g),w=[{type:"int32",data:[n]},{type:"int32",data:[d.util.sizeFromShape(f.shape)]}],I=e.runWebGPUProgram(b,[f,r],g,w,C),k=P({inputs:{x:I},backend:e,attrs:{shape:p}});u.push(I);let $=k;if(c!=null){u.push(k);const D=d.backend_util.getUndoAxesPermutation(c);$=Y({inputs:{x:$},backend:e,attrs:{perm:D}})}return u.forEach(D=>e.disposeData(D.dataId)),$}const Gc={kernelName:d.UnsortedSegmentSum,backendName:"webgpu",kernelFunc:Oc};const Hc=[_o,Ji,tr,or,rr,ur,fr,xr,br,Sr,vr,kr,Pr,Dr,zr,Er,Br,Ur,Gr,Xr,Qr,tn,rn,dn,cn,fn,Eo,Cn,yn,Nn,En,Mn,On,Hn,Kn,Yn,Qn,ea,sa,ia,na,da,ga,Ca,ha,Sa,Ia,$a,Na,Fa,Ta,Wa,Va,Oa,Ha,Ka,qa,ja,Za,zo,eu,nu,su,iu,du,cu,pu,gu,bu,Su,vu,Lo,ku,wn,Pu,Du,zu,Fu,Lu,Tu,Mu,Gu,Uu,Xu,qu,ju,ed,od,Fr,rd,ad,fd,dd,pd,xd,_r,bd,Sd,vd,kd,Nd,_a,Ad,_d,Ed,nn,Wd,Vd,Od,Xd,qd,jd,Zd,el,an,sl,il,nl,ul,Ao,cl,ml,xl,wl,vl,kl,Pl,Dl,zl,_l,Tl,Wl,Vl,Ol,Hl,Kl,Yr,bc,yc,Ic,$d,Yl,Zl,oc,rc,lc,hc,mc,fc,xc,Rc,La,$c,Nc,Ac,uc,Ec,Wc,cr,Vc,Gc,Md];for(const s of Hc)d.registerKernel(s);const Xc=globalThis;Xc.tmBackendWebGPU=Object.freeze({registered:typeof qt=="object"})})(tf);
