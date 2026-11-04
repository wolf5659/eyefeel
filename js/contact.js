(function () {
  "use strict";
  var form = document.getElementById("eyefeel-contact");
  var submit = document.getElementById("contact-submit");
  var status = document.getElementById("contact-status");
  var started = document.getElementById("contact-started");
  var en = document.getElementById("lang-en");
  var ar = document.getElementById("lang-ar");
  if (!form || !submit || !status) return;

  var lang = "en";
  var messages = {
    en: {
      sending: "Sending your message...",
      success: "Thank you. Your message has been sent.",
      activation: "Email delivery needs a one-time activation. An activation email has been requested. Please check the receiving inbox and spam folder.",
      error: "We couldn't send your message. Please try again or use WhatsApp below.",
      offline: "Your connection appears to be offline. Please try again.",
      retry: "Send Message"
    },
    ar: {
      sending: "جارٍ إرسال رسالتك...",
      success: "شكرًا لك. تم إرسال رسالتك.",
      activation: "يلزم تفعيل البريد الإلكتروني لمرة واحدة. تم طلب رسالة التفعيل. يرجى مراجعة البريد الوارد والرسائل غير المرغوب فيها.",
      error: "تعذّر إرسال الرسالة. يُرجى المحاولة مجددًا أو التواصل عبر واتساب أدناه.",
      offline: "يبدو أن الاتصال بالإنترنت غير متاح. يرجى المحاولة مجددًا.",
      retry: "إرسال الرسالة"
    }
  };

  function setStatus(message, error) {
    status.textContent = message;
    status.classList.toggle("is-visible", Boolean(message));
    status.classList.toggle("is-error", Boolean(error));
  }

  function changeLanguage(next) {
    lang = next;
    var rtl = next === "ar";
    en.setAttribute("aria-pressed", String(!rtl));
    ar.setAttribute("aria-pressed", String(rtl));
    form.setAttribute("dir", rtl ? "rtl" : "ltr");
    document.documentElement.lang = next;
    document.querySelectorAll("[data-en][data-ar]").forEach(function (element) {
      element.textContent = element.getAttribute("data-" + next);
    });
    document.querySelectorAll("[data-placeholder-en][data-placeholder-ar]").forEach(function (element) {
      element.placeholder = element.getAttribute("data-placeholder-" + next);
    });
    setStatus("", false);
  }

  started.value = String(Date.now());
  en.addEventListener("click", function () { changeLanguage("en"); });
  ar.addEventListener("click", function () { changeLanguage("ar"); });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = messages[lang].sending;
    setStatus("", false);

    var values = new FormData(form);
    var payload = {};
    values.forEach(function (value, key) { payload[key] = value; });
    payload._replyto = payload.email;
    payload._subject = "Eyefeel Contact | " + payload.topic;
    payload._template = "table";
    payload._captcha = "false";
    payload._url = "https://www.eyefeel.me/contact.html";

    try {
      var response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin"
      });
      var data = await response.json().catch(function () { return {}; });
      if (response.redirected && response.url.indexOf("formsubmit.co/") !== -1) {
        if (response.ok && (data.success === true || data.success === "true")) {
          setStatus(messages[lang].success, false);
          form.reset();
          started.value = String(Date.now());
        } else if (typeof data.message === "string" && /activation|activate|confirm.*email/i.test(data.message)) {
          setStatus(messages[lang].activation, true);
        } else {
          throw new Error("provider-rejected");
        }
      } else if (response.ok && data.ok) {
        setStatus(messages[lang].success, false);
        form.reset();
        started.value = String(Date.now());
      } else {
        throw new Error("not-delivered");
      }
    } catch (error) {
      setStatus(navigator.onLine === false ? messages[lang].offline : messages[lang].error, true);
    } finally {
      submit.disabled = false;
      submit.textContent = messages[lang].retry;
    }
  });
})();
