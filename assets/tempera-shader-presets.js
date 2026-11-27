(() => {
  'use strict';
  const bufferSource = "#define MAX_STEPS 220\r\n#define VOL_STEPS 200\r\n#define VOL_LENGTH 150.0\r\n#define VOL_DENSITY 0.025\r\n\r\nfloat hash(float n) \r\n{ \r\n    return fract(sin(n)*43758.5453); \r\n}\r\n\r\nfloat noise(in vec3 x) \r\n{\r\n    vec3 p = floor(x);\r\n    vec3 f = fract(x);\r\n    f = f*f*(3.0-2.0*f);\r\n    float n = p.x + p.y*57.0 + 113.0*p.z;\r\n    float res = mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),\r\n                        mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),\r\n                    mix(mix( hash(n+113.0), hash(n+114.0),f.x),\r\n                        mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);\r\n    return res;\r\n}\r\n\r\nfloat sdBox(vec3 p, vec3 b)\r\n{\r\n  vec3 q = abs(p) - b;\r\n  return length(max(q, 0.0)) + min(max(q.x,max(q.y,q.z)), 0.0);\r\n}\r\n\r\nvec4 getVolume(vec3 p) \r\n{\r\n\r\n    p.x += (noise(p*0.02 + sin(iTime*0.01))-0.5)*50.0*cos(noise(vec3(iTime*0.2)));\r\n    \r\n    vec3 c = vec3(40.0, 0.0, 0.0);\r\n    vec3 q = mod(p + 2.5*c, c) - 0.5*c;\r\n    \r\n    float d = 1.0 - sdBox(\r\n        (q - vec3(sin(q.z * 0.1 + iTime)*10.0 + noise(q*0.1)*10.0, sin(q.z * 0.2)*2.0, 200.0)), // position\r\n        vec3(1.0 - max(p.y*0.25, 0.5) + noise(vec3(q.x*0.2))*3.0, 10.0 * clamp((1.8 - p.z*0.01), 0.0, 1.2) + noise(p.zzz*0.1)*4.0, 200.0) // size\r\n    );\r\n    \r\n    // Color\r\n    vec3 col = mix(vec3(0.0, 1.0, 0.0), vec3(0.6 + (sin(iTime*0.08)*0.3), 0.8, 0.6), (p.y + 10.0) * 0.03);\r\n    \r\n    return vec4(col, d);\r\n\r\n}\r\n\r\nvec4 rayMarch(vec3 ro, vec3 rd) \r\n{\r\n\r\n    float stepLength = VOL_LENGTH / float(VOL_STEPS);\r\n    \r\n    float volumeDensity = VOL_DENSITY;\r\n\r\n    float density = 0.0;\r\n    float transmittance = 1.0;\r\n    vec3 energy = vec3(0.0);\r\n    \r\n    vec3 p = ro + rd;\r\n    \r\n    for (int i=0; i<MAX_STEPS; i++){\r\n    \r\n        if (transmittance < 0.05) break;\r\n        \r\n        float dsample = getVolume(p).w;\r\n    \r\n        if (dsample > 0.001){\r\n            \r\n            density = clamp(dsample * volumeDensity, 0.0, 1.0);\r\n            transmittance *= 1.0 - density;\r\n            \r\n            energy += density * transmittance;\r\n        \r\n        }\r\n        \r\n        p += rd * stepLength;\r\n    }\r\n    \r\n    vec3 col = getVolume(p).rgb;\r\n    \r\n    return vec4(energy, transmittance) * mix(vec4(0.5, 1.0 * (cos(iTime*0.1)*0.5 + 1.0), 1.0 * (sin(iTime*0.2)*0.5 + 1.0), 1.0), vec4(col, 1.0), transmittance);\r\n    \r\n}\r\n\r\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\r\n{\r\n\r\n    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;\r\n    uv.x = uv.x*2.0 - 1.0;\r\n    uv.y = uv.y*2.0 - 0.5;\r\n    if (uv.x < -1.0 || uv.y < -0.5) discard;\r\n    \r\n    // Ray origin\r\n    vec3 ro = vec3(-20.0, -50.0, 0.0);\r\n    // Ray direction\r\n    vec3 rd = normalize(vec3(uv.x + 1.0, uv.y + 0.7, 1.0));\r\n    \r\n    vec4 col = rayMarch(ro, rd);\r\n    \r\n    // Sky color\r\n    vec3 tcol = vec3(0.02, 0.04, 0.053);\r\n    vec3 bcol = vec3(0.1, 0.13, 0.25);\r\n    vec3 sky = col.rgb + mix(tcol, bcol, -uv.y*0.5) * col.a;\r\n    \r\n    // Stars\r\n    float stars = clamp(pow(max(texture(iChannel0, uv).r - texture(iChannel0, uv*0.9).r, 0.0) - 0.25, 9.0)*100.0, 0.0, 1.0);\r\n    \r\n    fragColor = vec4(sky + stars, 1.0);\r\n    \r\n}";
  const commonSource = "\r\nfloat gyroid (vec3 seed) { return dot(sin(seed),cos(seed.yzx)); }\r\nfloat fbm (vec3 seed)\r\n{\r\n    float result = 0., a = .5;\r\n    for (int i = 0; i < 3; ++i, a/=2.)\r\n    {\r\n        result += (gyroid(seed/a))*a;\r\n    }\r\n    return result;\r\n}\r\n\r\n// Dave Hoskins https://www.shadertoy.com/view/4djSRW\r\nfloat hash11(float p)\r\n{\r\n    p = fract(p * .1031);\r\n    p *= p + 33.33;\r\n    p *= p + p;\r\n    return fract(p);\r\n}\r\nvec2 hash21(float p)\r\n{\r\n\tvec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));\r\n\tp3 += dot(p3, p3.yzx + 33.33);\r\n    return fract((p3.xx+p3.yz)*p3.zy);\r\n\r\n}\r\nvec4 hash41(float p)\r\n{\r\n\tvec4 p4 = fract(vec4(p) * vec4(.1031, .1030, .0973, .1099));\r\n    p4 += dot(p4, p4.wzxy+33.33);\r\n    return fract((p4.xxyz+p4.yzzw)*p4.zywx);\r\n}";
  const imageSource = "\r\n// Particles Party\r\n\r\n// simple colorful particles system\r\n// will try voronoi tracking next time\r\n\r\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\r\n{\r\n    vec3 color = vec3(0);\r\n    \r\n    // coordinates\r\n    vec2 uv = fragCoord/iResolution.xy;\r\n    float rng = texture(iChannel1, fragCoord/1024.).r;\r\n    vec2 aspect = vec2(iResolution.y/iResolution.x, 1.);\r\n    \r\n    // data\r\n    vec4 data = texture(iChannel0, uv);\r\n    float shade = data.r;\r\n    float mat = data.g;\r\n    \r\n    // rainbow\r\n    color = .5+.5*cos(vec3(1,2,3)*4.9 + mat);\r\n    \r\n    // light\r\n    vec3 un = vec3(0.005*aspect, 0);\r\n    #define T(un) texture(iChannel0, uv+un).r\r\n    vec3 normal = normalize(vec3(T(un.xz)-T(-un.xz),T(un.zy)-T(-un.zy), .5));\r\n    float d = dot(normal, normalize(vec3(0,-2,1)))*.5+.5;\r\n    color += pow(d, 10.);\r\n    \r\n    // shadow\r\n    color *= smoothstep(.0,.01,shade);\r\n\r\n    fragColor = vec4(color, 1);\r\n}";
  window.PilamiTemperaShaders = {
    create(canvas, onError, preset) {
      const activeBufferSource = preset && preset.bufferSource ? preset.bufferSource : bufferSource;
      const activeCommonSource = preset ? (preset.commonSource || '') : commonSource;
      const activeImageSource = preset && preset.imageSource ? preset.imageSource : imageSource;
      const contextOptions = { alpha:false, antialias:false, depth:false, stencil:false, preserveDrawingBuffer:true, powerPreference:'high-performance' };
      const gl2 = canvas.getContext('webgl2', contextOptions);
      const webgl2 = Boolean(gl2);
      const gl = gl2 || canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);
      if (!gl) { onError('WebGL 2 et WebGL 1 sont indisponibles dans ce navigateur.'); return null; }
      let disposed = false, programBuffer, programImage, bufferTexture, framebuffer, noiseTexture, vao, vertexBuffer;
      function fail(message) { onError(message); dispose(); return null; }
      function shader(type, source) {
        const item = gl.createShader(type);
        gl.shaderSource(item, source);
        gl.compileShader(item);
        if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
          const message = gl.getShaderInfoLog(item) || 'Erreur de compilation GLSL';
          gl.deleteShader(item);
          throw new Error(message);
        }
        return item;
      }
      function program(fragment) {
        const vertexSource = webgl2
          ? '#version 300 es\nvoid main(){ vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2); gl_Position=vec4(p*2.0-1.0,0.0,1.0); }'
          : 'attribute vec2 a_position; void main(){ gl_Position=vec4(a_position,0.0,1.0); }';
        const vertex = shader(gl.VERTEX_SHADER, vertexSource);
        const pixel = shader(gl.FRAGMENT_SHADER, fragment);
        const result = gl.createProgram();
        gl.attachShader(result, vertex);
        gl.attachShader(result, pixel);
        gl.linkProgram(result);
        gl.deleteShader(vertex);
        gl.deleteShader(pixel);
        if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(result) || 'Erreur de liaison GLSL');
        return result;
      }
      function wrap(source, channels) {
        const uniforms = (webgl2 ? '#version 300 es\n' : '') + 'precision highp float;\nuniform vec3 iResolution;\nuniform float iTime;\nuniform sampler2D iChannel0;\n' + (channels > 1 ? 'uniform sampler2D iChannel1;\n' : '');
        const code = activeCommonSource + '\n' + source;
        if (!webgl2) return uniforms + code.replace(/\btexture\s*\(/g, 'texture2D(') + '\nvoid main(){ vec4 pilamiColor; mainImage(pilamiColor, gl_FragCoord.xy); gl_FragColor=pilamiColor; }';
        return uniforms + code + '\nout vec4 fragColor;\nvoid main(){ mainImage(fragColor, gl_FragCoord.xy); }';
      }
      function texture(width,height,data=null) {
        const tex=gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D,tex);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
        gl.texImage2D(gl.TEXTURE_2D,0,webgl2 ? gl.RGBA8 : gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
        return tex;
      }
      function dispose() {
        if (disposed) return;
        disposed = true;
        if (!gl) return;
        if (programBuffer) gl.deleteProgram(programBuffer);
        if (programImage) gl.deleteProgram(programImage);
        if (bufferTexture) gl.deleteTexture(bufferTexture);
        if (noiseTexture) gl.deleteTexture(noiseTexture);
        if (framebuffer) gl.deleteFramebuffer(framebuffer);
        if (vao && webgl2) gl.deleteVertexArray(vao);
        if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      }
      try {
        programBuffer = program(wrap(activeBufferSource, 1));
        programImage = program(wrap(activeImageSource, 2));
        if (webgl2) {
          vao=gl.createVertexArray();
          gl.bindVertexArray(vao);
        } else {
          vertexBuffer=gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
          gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
        }
        const noise=new Uint8Array(128*128*4);
        let seed=918273;
        for(let n=0;n<noise.length;n+=4){ seed=(seed*1664525+1013904223)>>>0; const v=seed>>>24; noise[n]=v; noise[n+1]=v; noise[n+2]=v; noise[n+3]=255; }
        noiseTexture=texture(128,128,noise);
        bufferTexture=texture(1,1,new Uint8Array([0,0,0,255]));
        framebuffer=gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,bufferTexture,0);
        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw new Error('Impossible de créer le buffer de rendu.');
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      } catch(error) { return fail(error.message || 'Le shader n’a pas pu être compilé.'); }
      let width=0,height=0;
      function resize() {
        const rect=canvas.getBoundingClientRect();
        const scale=Math.min(1,420/Math.max(1,rect.width),236/Math.max(1,rect.height));
        const w=Math.max(1,Math.round(rect.width*scale)), h=Math.max(1,Math.round(rect.height*scale));
        if(w===width&&h===height)return;
        width=w;height=h;canvas.width=w;canvas.height=h;
        gl.bindTexture(gl.TEXTURE_2D,bufferTexture);
        gl.texImage2D(gl.TEXTURE_2D,0,webgl2 ? gl.RGBA8 : gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,bufferTexture,0);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      }
      function uniforms(prog,t,w,h) {
        gl.useProgram(prog);
        const resolution=gl.getUniformLocation(prog,'iResolution');
        if(resolution) gl.uniform3f(resolution,w,h,1);
        const time=gl.getUniformLocation(prog,'iTime');
        if(time) gl.uniform1f(time,t);
        gl.uniform1i(gl.getUniformLocation(prog,'iChannel0'),0);
      }
      function render(t) {
        if(disposed)return;
        resize();
        gl.viewport(0,0,width,height);
        if (webgl2) gl.bindVertexArray(vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D,noiseTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(programBuffer);
        uniforms(programBuffer,t,width,height);
        draw(programBuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D,bufferTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D,noiseTexture);
        gl.useProgram(programImage);
        const resolution=gl.getUniformLocation(programImage,'iResolution');
        if(resolution)gl.uniform3f(resolution,width,height,1);
        const time=gl.getUniformLocation(programImage,'iTime');
        if(time)gl.uniform1f(time,t);
        gl.uniform1i(gl.getUniformLocation(programImage,'iChannel0'),0);
        gl.uniform1i(gl.getUniformLocation(programImage,'iChannel1'),1);
        draw(programImage);
      }
      function draw(prog) {
        if (webgl2) gl.drawArrays(gl.TRIANGLES,0,3);
        else {
          gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
          const location=gl.getAttribLocation(prog,'a_position');
          if(location>=0){ gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0); }
          gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
        }
      }
      return { render, dispose, commonSource };
    }
  };
})();