import { PageLoader } from "@/components/PageLoader";

/**
 * Fallback de navegação das rotas autenticadas. Com as páginas em SSR dinâmico,
 * este boundary de Suspense faz a tela nova aparecer **na hora** (skeleton)
 * enquanto o Server Component busca os dados — em vez de a tela antiga ficar
 * "congelada" esperando o round-trip até a API/banco.
 */
export default function AppLoading() {
  return <PageLoader />;
}
