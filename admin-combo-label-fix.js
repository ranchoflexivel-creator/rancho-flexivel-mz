(() => {
  const replace = () => {
    document.querySelectorAll("body *").forEach(el => {
      if (el.children.length === 0 && el.textContent.trim() === "Rancho do Mês") el.textContent = "Combo do Mês";
      if (el.children.length === 0 && el.textContent.includes("Rancho(s)")) el.textContent = el.textContent.replaceAll("Rancho(s)", "Combo(s)");
      if (el.children.length === 0 && el.textContent.includes("Editar Rancho")) el.textContent = el.textContent.replaceAll("Editar Rancho", "Editar Combo");
    });
  };
  replace();
  new MutationObserver(replace).observe(document.body, { childList: true, subtree: true });
})();
