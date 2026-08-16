// As imagens dos produtos já são renderizadas pelo app.js a partir dos dados
// carregados. Evitamos uma segunda consulta ao Supabase e um MutationObserver
// permanente, que deixavam a página pesada.
import "./public-cart-ui-fix.js";
