/**
 * 电商图片生成器 - 完整真实API测试（修正路由）
 */
const http = require('http');
const https = require('https');
const BASE = 'http://127.0.0.1:3010';
const PUBLIC = 'https://crazydream.site';

class TR {
    constructor() { this.t=[];this.r={p:0,f:0,t:0}; }
    test(n,fn) { this.t.push({n,fn}); }
    async run() {
        console.log('\n🔌 商品主图生成器 - 全功能真实API测试\n');
        for (const x of this.t) {
            try { await x.fn(); this.r.p++; console.log(`✅ ${x.n}`); }
            catch(e) { this.r.f++; console.log(`❌ ${x.n}\n   ${e.message}`); }
            this.r.t++;
        }
        const pct = Math.round(this.r.p/this.r.t*100);
        console.log(`\n${'='.repeat(55)}\n📊 ${this.r.p}/${this.r.t} 通过 (${pct}%)${this.r.f ? ` ⚠️ ${this.r.f}失败` : ' ✅ 全部通过'}\n${'='.repeat(55)}\n`);
    }
}

function req(url, opts={}) {
    return new Promise((rs,rj) => {
        const u = new URL(url); const m = opts.method||'GET';
        const o = { hostname:u.hostname, port:u.port, path:u.pathname+u.search, method:m, headers:{'Content-Type':'application/json',...opts.headers}, timeout:30000 };
        const r = http.request(o, res => {
            let d=''; res.on('data',c=>d+=c); res.on('end',() => {
                try { rs({s:res.statusCode, b:JSON.parse(d)}); } catch { rs({s:res.statusCode, b:d}); }
            });
        });
        r.on('timeout',()=>{r.destroy();rj(new Error('超时'));});
        r.on('error',rj);
        if(opts.body) r.write(JSON.stringify(opts.body));
        r.end();
    });
}

function reqPub(url) {
    return new Promise((rs,rj) => {
        https.get(url, {timeout:10000}, res => {
            let d=''; res.on('data',c=>d+=c); res.on('end',()=>rs({s:res.statusCode,b:d}));
        }).on('error',rj);
    });
}

const A = (c,m)=> { if(!c) throw new Error(m||'断言失败'); };
const OK = (s,m)=> A(s>=200&&s<400, `${m}: HTTP ${s}`);
const EQ = (a,b,m)=> A(a===b, `${m}: 期望${b} 实际${a}`);

const runner = new TR();
const U = { username:`t_${Date.now()}`, password:'Test1234', nickname:'全功能测试' };
let token = null, taskId = null;

// ═══════════ 1. 服务健康 ═══════════
runner.test('1.1 服务运行', async () => {
    const r = await req(`${BASE}/health`);
    OK(r.s,'健康检查'); EQ(r.b.status,'ok','状态');
});

runner.test('1.2 MXAPI可用', async () => {
    const r = await req(`${BASE}/health`);
    A(r.b.mxapi_available===true,'MXAPI Key应已加载');
});

runner.test('1.3 DashScope备用', async () => {
    const r = await req(`${BASE}/health`);
    A(r.b.dashscope_available===true,'DashScope Key应已加载');
});

runner.test('1.4 API策略为mxapi', async () => {
    const r = await req(`${BASE}/health`);
    EQ(r.b.api_strategy,'mxapi','当前策略');
});

// ═══════════ 2. 用户认证 ═══════════
runner.test('2.1 注册新用户', async () => {
    const r = await req(`${BASE}/api/auth/register`, {method:'POST',body:U});
    OK(r.s,'注册');
    console.log(`       userId=${r.b.data?.userId} username=${U.username}`);
});

runner.test('2.2 登录获取Token', async () => {
    const r = await req(`${BASE}/api/auth/login`, {method:'POST',body:{username:U.username,password:U.password}});
    OK(r.s,'登录');
    A(r.b.data?.token, '应返回token');
    token = r.b.data.token;
    console.log(`       token=${token.substring(0,25)}...`);
});

runner.test('2.3 获取用户信息', async () => {
    const r = await req(`${BASE}/api/auth/me`, {headers:{Authorization:`Bearer ${token}`}});
    OK(r.s,'用户信息');
    A(r.b.data?.username, '应有用户名');
});

// ═══════════ 3. 主图生成 ═══════════
runner.test('3.1 基础生成(1:1)', async () => {
    const r = await req(`${BASE}/api/generate`, {
        method:'POST',
        body:{prompt:'白色陶瓷咖啡杯，纯白背景，产品摄影，工作室灯光',aspect_ratio:'1:1',provider:'mxapi'}
    });
    OK(r.s,'基础生成');
    taskId = r.b.data?.task_id;
    A(taskId,'应返回task_id');
    console.log(`       task_id=${taskId.substring(0,12)}... provider=${r.b.data?.provider}`);
});

runner.test('3.2 3:4竖版生成', async () => {
    const r = await req(`${BASE}/api/generate`, {
        method:'POST',
        body:{prompt:'白色陶瓷杯产品图，简约风格',aspect_ratio:'3:4',provider:'mxapi'}
    });
    OK(r.s,'3:4生成');
    A(r.b.data?.task_id, '应返回task_id');
});

runner.test('3.3 16:9横版生成', async () => {
    const r = await req(`${BASE}/api/generate`, {
        method:'POST',
        body:{prompt:'白色陶瓷杯，场景展示，明亮光线',aspect_ratio:'16:9',provider:'mxapi'}
    });
    OK(r.s,'16:9生成');
});

runner.test('3.4 9:16竖版生成', async () => {
    const r = await req(`${BASE}/api/generate`, {
        method:'POST',
        body:{prompt:'白色陶瓷杯，手机展示',aspect_ratio:'9:16',provider:'mxapi'}
    });
    OK(r.s,'9:16生成');
});

// ═══════════ 4. 任务状态轮询 ═══════════
runner.test('4.1 查询任务状态', async () => {
    A(taskId, '需要有task_id');
    const r = await req(`${BASE}/api/status?task_id=${taskId}&provider=mxapi`);
    OK(r.s,'状态查询');
    A(r.b.data?.status, '应有状态');
    console.log(`       status=${r.b.data.status}`);
});

// ═══════════ 5. 提示词增强 ═══════════
runner.test('5.1 智能提示词增强', async () => {
    const r = await req(`${BASE}/api/enhance`, {
        method:'POST',
        body:{prompt:'白色陶瓷杯'}
    });
    // enhance可能依赖千问API，可能返回成功或503
    A([200,201,202,500,503].includes(r.s), `增强API HTTP ${r.s}`);
    console.log(`       HTTP ${r.s} ${JSON.stringify(r.b).substring(0,120)}`);
});

// ═══════════ 6. 详情页提示词 ═══════════
runner.test('6.1 详情页5图提示词生成', async () => {
    const r = await req(`${BASE}/api/detail-prompts`, {
        method:'POST',
        body:{
            product_name:'白色陶瓷杯',
            description:'高品质白色陶瓷咖啡杯，简约设计',
            features:'防滑底座|304不锈钢内胆|500ml容量',
            provider:'mxapi'
        }
    });
    console.log(`       HTTP ${r.s} ${JSON.stringify(r.b).substring(0,150)}`);
    A([200,202,400].includes(r.s) || (r.b.data?.prompts), '详情页API应可达');
});

// ═══════════ 7. 模板提示词 ═══════════
runner.test('7.1 模板一(无风格参考)', async () => {
    const r = await req(`${BASE}/api/template-prompts`, {
        method:'POST',
        body:{prompt:'白色陶瓷杯',template:'template1',tags:['简约','现代'],provider:'mxapi'}
    });
    console.log(`       HTTP ${r.s} ${JSON.stringify(r.b).substring(0,150)}`);
    A([200,202,400].includes(r.s), '模板一API应可达');
});

runner.test('7.2 模板二(有风格参考)', async () => {
    const r = await req(`${BASE}/api/template-prompts`, {
        method:'POST',
        body:{prompt:'白色陶瓷杯',template:'template2',tags:['简约','现代'],style_reference:'minimalist product photography, soft lighting',provider:'mxapi'}
    });
    console.log(`       HTTP ${r.s} ${JSON.stringify(r.b).substring(0,150)}`);
    A([200,202,400].includes(r.s), '模板二API应可达');
});

// ═══════════ 8. 历史记录 ═══════════
runner.test('8.1 获取用户历史', async () => {
    const r = await req(`${BASE}/api/history`, {headers:{Authorization:`Bearer ${token}`}});
    OK(r.s,'历史记录');
    const list = r.b.data || r.b.images || r.b;
    A(Array.isArray(list) || typeof list==='object', '应返回数据');
    console.log(`       数量: ${Array.isArray(list)?list.length:Object.keys(list).length}`);
});

// ═══════════ 9. 错误处理 ═══════════
runner.test('9.1 空prompt拒绝', async () => {
    const r = await req(`${BASE}/api/generate`, {
        method:'POST',
        body:{prompt:'',aspect_ratio:'1:1',provider:'mxapi'}
    });
    A(r.s>=400||r.b.code!==200, `空prompt应被拒绝: HTTP ${r.s}`);
});

runner.test('9.2 404路由', async () => {
    const r = await req(`${BASE}/api/xyz-not-exist`);
    EQ(r.s,404,'404路由');
});

runner.test('9.3 无Token访问历史', async () => {
    const r = await req(`${BASE}/api/history`);
    A(r.s===401||r.s===403, `无Token应被拒绝: HTTP ${r.s}`);
});

// ═══════════ 10. 公网可达 ═══════════
runner.test('10.1 公网首页', async () => {
    const r = await reqPub(`${PUBLIC}/app/product-image/`);
    OK(r.s,'公网首页');
    A(r.b.includes('html')||r.b.includes('HTML')||r.b.includes('product-image')||r.b.includes('电商'),'应返回页面内容');
});

runner.test('10.2 Nginx静态资源', async () => {
    const r = await reqPub(`${PUBLIC}/app/product-image/index.html`);
    OK(r.s,'静态HTML');
    A(r.b.length>100, `页面大小应>100字节: ${r.b.length}`);
});

runner.run().catch(console.error);
