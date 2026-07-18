import { requireChatGPTUser } from "../chatgpt-auth";
import ModelShowcase from "../model-showcase";

const OWNER_EMAIL = "lucmcote@gmail.com";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await requireChatGPTUser("/studio");

  if (user.email.toLowerCase() !== OWNER_EMAIL) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
        <section style={{ maxWidth: "34rem", textAlign: "center" }}>
          <h1>Owner studio</h1>
          <p>This workspace is reserved for the DREADSTACHE portfolio owner.</p>
          <a href="/">Return to the client showcase</a>
        </section>
      </main>
    );
  }

  return <ModelShowcase studioMode />;
}
