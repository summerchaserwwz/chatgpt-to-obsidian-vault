import { FolderOpen, ShieldCheck } from "../ui/icons";

export function OptionsApp() {
  return (
    <main className="app-shell">
      <section className="panel" style={{ maxWidth: 760, minHeight: "100vh", margin: "0 auto" }}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h2>ChatGPT to Obsidian Vault</h2>
          </div>
          <span>local-first</span>
        </div>
        <div className="active-summary">
          <ShieldCheck size={20} />
          <div>
            <h2>本地处理</h2>
            <p>对话内容只在浏览器本地读取、格式化和写入。MVP 不上传内容，也不使用云端账号。</p>
          </div>
        </div>
        <div className="active-summary" style={{ marginTop: 12 }}>
          <FolderOpen size={20} />
          <div>
            <h2>Vault 授权</h2>
            <p>直接写入需要在侧边栏里选择 Vault 或子目录；未授权时会回退到浏览器 Downloads。</p>
          </div>
        </div>
      </section>
    </main>
  );
}
