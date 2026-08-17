(() => {
  const STYLE_ID = "rf-public-visibility-fix-style";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Keep a single visible language selector. The legacy public scripts
         use #rfLanguage, while index.html contains #languageSelect. */
      #languageContainer {
        display: none !important;
      }

      #rfLanguage {
        display: inline-block !important;
        visibility: visible !important;
        opacity: 1 !important;
        border: 1px solid #c1c9bf !important;
        background: #fff !important;
        color: #00361a !important;
        border-radius: 999px !important;
        padding: 8px 12px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        outline: none !important;
      }

      /* Footer: keep a dark, high-contrast surface even when an admin
         setting supplies a footer image. */
      footer.rf-footer,
      footer {
        background-color: #00361a !important;
        background-image: none !important;
        color: #fff !important;
      }

      footer.rf-footer .rf-footer-brand {
        color: #fff !important;
      }

      footer.rf-footer .rf-footer-label {
        color: #fdc36d !important;
      }

      footer.rf-footer .rf-footer-text,
      footer.rf-footer .rf-footer-message {
        color: rgba(255,255,255,.88) !important;
      }

      footer.rf-footer .rf-footer-bottom {
        color: rgba(255,255,255,.72) !important;
        border-color: rgba(255,255,255,.18) !important;
      }

      footer.rf-footer #footerContact,
      footer.rf-footer #footerMessage {
        color: rgba(255,255,255,.88) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function sync() {
    ensureStyle();

    const language = document.querySelector("#rfLanguage");
    if (language) {
      language.value = localStorage.getItem("rf_lang") || "pt";

      if (!language.dataset.rfVisibilityBound) {
        language.dataset.rfVisibilityBound = "1";
        language.addEventListener("change", () => {
          localStorage.setItem("rf_lang", language.value);
        });
      }
    }

    const footer = document.querySelector("footer.rf-footer, footer");
    if (footer) {
      footer.style.setProperty("background-color", "#00361a", "important");
      footer.style.setProperty("background-image", "none", "important");
      footer.style.setProperty("color", "#ffffff", "important");
    }
  }

  sync();

  new MutationObserver(sync).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
