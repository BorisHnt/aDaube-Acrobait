// Localisation of the user interface only. PDF document contents are never translated.
// Add new strings as [French source, English, Vietnamese] tuples.
const rows = [
  ["aDaube Acrobait — éditeur PDF","aDaube Acrobait — PDF editor","aDaube Acrobait — Trình chỉnh sửa PDF"],
  ["aDaube Acrobait — éditeur PDF gratuit, local et sans compte.","aDaube Acrobait — free, local PDF editor. No account required.","aDaube Acrobait — trình chỉnh sửa PDF miễn phí, xử lý tại máy, không cần tài khoản."],
  ["BÊTA","BETA","BETA"],
  ["Local uniquement","Local only","Chỉ trên thiết bị"],
  ["Ouvrir","Open","Mở"],
  ["Exporter le PDF","Export PDF","Xuất PDF"],
  ["Fichier","File","Tệp"],
  ["Nouveau document","New document","Tài liệu mới"],
  ["Ouvrir un PDF","Open PDF","Mở PDF"],
  ["Exporter en PDF","Export as PDF","Xuất thành PDF"],
  ["Importer une police","Import a font","Nhập phông chữ"],
  ["Édition","Edit","Chỉnh sửa"],
  ["Annuler","Undo","Hoàn tác"],
  ["Rétablir","Redo","Làm lại"],
  ["Dupliquer l'élément","Duplicate item","Nhân bản đối tượng"],
  ["Supprimer l'élément","Delete item","Xóa đối tượng"],
  ["Affichage","View","Xem"],
  ["Zoom arrière","Zoom out","Thu nhỏ"],
  ["Zoom avant","Zoom in","Phóng to"],
  ["Ajuster à la largeur","Fit to width","Vừa chiều rộng"],
  ["Afficher / masquer les pages","Show / hide pages","Hiện / ẩn trang"],
  ["Insertion","Insert","Chèn"],
  ["Zone de texte","Text box","Hộp văn bản"],
  ["Rectangle","Rectangle","Hình chữ nhật"],
  ["Surligneur","Highlighter","Bút đánh dấu"],
  ["Nouvelle page blanche","New blank page","Trang trắng mới"],
  ["Format","Format","Định dạng"],
  ["Gras","Bold","Đậm"],
  ["Italique","Italic","Nghiêng"],
  ["Souligné","Underline","Gạch chân"],
  ["Aligner à gauche","Align left","Căn trái"],
  ["Centrer","Center","Căn giữa"],
  ["Aligner à droite","Align right","Căn phải"],
  ["Outils","Tools","Công cụ"],
  ["Importer TTF / OTF","Import TTF / OTF","Nhập TTF / OTF"],
  ["Compatibilité et limites","Compatibility and limitations","Tương thích và giới hạn"],
  ["Aide","Help","Trợ giúp"],
  ["Guide de démarrage","Getting started","Hướng dẫn bắt đầu"],
  ["Code source GitHub","Source code on GitHub","Mã nguồn trên GitHub"],
  ["Documents traités localement","Documents processed locally","Tài liệu được xử lý trên thiết bị"],
  ["Police","Font","Phông chữ"],
  ["Taille de la police","Font size","Cỡ chữ"],
  ["Police de caractères","Font family","Họ phông chữ"],
  ["Taille de police","Font size","Cỡ chữ"],
  ["Couleur du texte ou de la forme","Text or shape color","Màu chữ hoặc hình"],
  ["Couleur","Color","Màu sắc"],
  ["Réduire","Zoom out","Thu nhỏ"],
  ["Zoom","Zoom","Thu phóng"],
  ["Agrandir","Zoom in","Phóng to"],
  ["Pages","Pages","Trang"],
  ["Supprimer la page","Delete page","Xóa trang"],
  ["Vos PDF, vos règles.","Your PDFs, your rules.","PDF của bạn, theo cách của bạn."],
  ["Ouvrez un PDF pour ajouter du texte, corriger un passage, annoter et exporter. Sans abonnement et sans transfert de vos fichiers.","Open a PDF to add text, correct a passage, annotate, and export. No subscription and no document upload.","Mở PDF để thêm văn bản, chỉnh sửa đoạn chữ, chú thích và xuất tệp. Không cần đăng ký và không tải tài liệu lên máy chủ."],
  ["Page blanche","Blank page","Trang trắng"],
  ["Ou glissez-déposez votre PDF ici","Or drag and drop your PDF here","Hoặc kéo và thả tệp PDF vào đây"],
  ["Propriétés","Properties","Thuộc tính"],
  ["Sélectionnez une zone de texte ou une forme pour modifier ses propriétés.","Select a text box or shape to edit its properties.","Chọn hộp văn bản hoặc hình để chỉnh sửa thuộc tính."],
  ["Astuce : cliquez sur le texte d'un PDF pour le recouvrir et le remplacer.","Tip: click PDF text to cover it and add a replacement.","Mẹo: nhấp vào văn bản trong PDF để che và thay thế bằng nội dung mới."],
  ["Contenu","Content","Nội dung"],
  ["Largeur","Width","Chiều rộng"],
  ["Hauteur","Height","Chiều cao"],
  ["Dupliquer","Duplicate","Nhân bản"],
  ["Supprimer","Delete","Xóa"],
  ["Les polices non incorporées sont remplacées à l'export. Importez leur fichier TTF/OTF pour les intégrer.","Fonts that are not embedded are substituted on export. Import their TTF/OTF files to embed them.","Các phông chữ chưa nhúng sẽ bị thay thế khi xuất. Hãy nhập tệp TTF/OTF để nhúng phông chữ."],
  ["Prêt","Ready","Sẵn sàng"],
  ["Aucun document","No document","Chưa có tài liệu"],
  ["À propos d'aDaube Acrobait","About aDaube Acrobait","Giới thiệu aDaube Acrobait"],
  ["Remplacer le texte :","Replacing text:","Thay thế văn bản:"],
  ["cliquez sur un morceau de texte dans votre PDF. L'éditeur le recouvre visuellement puis ajoute votre version par-dessus. Le texte original reste techniquement présent dans le fichier : ce n'est pas un outil de caviardage sécurisé.","click a piece of text in your PDF. The editor visually covers it and overlays your version. The original text is still technically present in the file: this is not a secure redaction tool.","nhấp vào một đoạn văn bản trong PDF. Trình chỉnh sửa sẽ che đoạn đó và đặt nội dung mới lên trên. Văn bản gốc vẫn còn trong tệp: đây không phải công cụ xóa thông tin bảo mật."],
  ["Polices :","Fonts:","Phông chữ:"],
  ["le catalogue inclut des noms de polices Microsoft, Apple et libres. Une police doit être disponible sur votre appareil pour être affichée correctement. Pour garantir son rendu dans le PDF exporté, importez un fichier TTF/OTF que vous avez le droit d'utiliser.","the list includes Microsoft, Apple, and open-source font names. A font must be installed on your device to display correctly. To preserve its appearance in the exported PDF, import a TTF/OTF file that you are licensed to use.","danh sách bao gồm tên các phông chữ Microsoft, Apple và mã nguồn mở. Phông chữ phải có trên thiết bị để hiển thị chính xác. Để giữ nguyên kiểu chữ khi xuất PDF, hãy nhập tệp TTF/OTF mà bạn được phép sử dụng."],
  ["Limites :","Limitations:","Giới hạn:"],
  ["conservation visuelle approximative des textes remplacés, pas de modification native des objets PDF, ni d'OCR, ni de signature numérique. Les documents et les polices restent dans la session du navigateur. Les bibliothèques PDF.js, pdf-lib et les icônes sont chargées depuis des CDN au premier usage.","replaced text may not preserve its exact appearance; native PDF text editing, OCR and digital signatures are not supported. Documents and imported fonts remain in the browser session. PDF.js, pdf-lib, and icons are loaded from CDNs when first used.","văn bản thay thế có thể không giữ nguyên định dạng; ứng dụng chưa hỗ trợ chỉnh sửa trực tiếp đối tượng PDF, OCR hoặc chữ ký số. Tài liệu và phông chữ đã nhập chỉ tồn tại trong phiên trình duyệt. PDF.js, pdf-lib và biểu tượng được tải từ CDN khi sử dụng lần đầu."],
  ["Compris","Got it","Đã hiểu"],
  ["Nom du document","Document name","Tên tài liệu"],
  ["Sans titre","Untitled","Chưa đặt tên"],
  ["Menu principal","Main menu","Trình đơn chính"],
  ["Outils de document","Document tools","Công cụ tài liệu"],
  ["Annuler (Ctrl+Z)","Undo (Ctrl+Z)","Hoàn tác (Ctrl+Z)"],
  ["Sélectionner ou remplacer du texte","Select or replace text","Chọn hoặc thay thế văn bản"],
  ["Ajouter du texte","Add text","Thêm văn bản"],
  ["Ajouter un rectangle","Add rectangle","Thêm hình chữ nhật"],
  ["Surligner","Highlight","Đánh dấu"],
  ["Pages du document","Document pages","Các trang tài liệu"],
  ["Ajouter une page","Add page","Thêm trang"],
  ["Document PDF","PDF document","Tài liệu PDF"],
  ["Fermer les propriétés","Close properties","Đóng bảng thuộc tính"],
  ["Langue de l’interface","Interface language","Ngôn ngữ giao diện"],
  ["PDF standard","Standard PDF","PDF tiêu chuẩn"],
  ["Importées — incorporables","Imported — embeddable","Đã nhập — có thể nhúng"],
  ["Mode sélection","Selection mode","Chế độ chọn"],
  ["Outil {tool} : cliquez sur la page","{tool} tool: click on the page","Công cụ {tool}: nhấp vào trang"],
  ["Votre texte","Your text","Văn bản của bạn"],
  ["Page {n} / {count}","Page {n} / {count}","Trang {n} / {count}"],
  ["Police importée : sera incorporée à l’export.","Imported font: it will be embedded on export.","Phông chữ đã nhập: sẽ được nhúng khi xuất."],
  ["Police non importée : l’export PDF utilisera une famille standard proche. Importez le TTF/OTF pour un rendu fidèle.","Font not imported: PDF export will use a similar standard font. Import the TTF/OTF file for accurate output.","Phông chữ chưa được nhập: khi xuất PDF sẽ dùng phông tiêu chuẩn tương tự. Hãy nhập TTF/OTF để hiển thị chính xác."],
  ["Police système : à importer en TTF/OTF pour l’incorporer au PDF.","System font: import its TTF/OTF file to embed it in the PDF.","Phông chữ hệ thống: hãy nhập tệp TTF/OTF để nhúng vào PDF."],
  ["Texte éditable","Editable text","Văn bản có thể sửa"],
  ["Déplacer","Move","Di chuyển"],
  ["Remplacer visuellement : {text}","Visually replace: {text}","Thay thế trực quan: {text}"],
  ["Remplacer {text}","Replace {text}","Thay thế {text}"],
  ["Correction visuelle : le texte d’origine demeure dans le PDF et reste extractible.","Visual replacement: the original text remains in the PDF and can still be extracted.","Thay thế trực quan: văn bản gốc vẫn còn trong PDF và vẫn có thể trích xuất."],
  ["Une page du PDF n’a pas pu être affichée.","A PDF page could not be displayed.","Không thể hiển thị một trang PDF."],
  ["Aller à la page {n}","Go to page {n}","Đến trang {n}"],
  ["Page {n}","Page {n}","Trang {n}"],
  ["Choisissez un fichier PDF.","Please select a PDF file.","Vui lòng chọn tệp PDF."],
  ["Ouverture du PDF...","Opening PDF…","Đang mở PDF…"],
  ["PDF chargé : {n} page(s).","PDF loaded: {n} page(s).","Đã mở PDF: {n} trang."],
  ["PDF ouvert. Cliquez sur un texte pour créer une correction visuelle.","PDF opened. Click text to create a visual replacement.","Đã mở PDF. Nhấp vào văn bản để tạo phần thay thế trực quan."],
  ["Ouverture impossible : {error}","Cannot open PDF: {error}","Không thể mở PDF: {error}"],
  ["Impossible de lire ce PDF : {error}","Cannot read this PDF: {error}","Không thể đọc PDF này: {error}"],
  ["Nouveau document A4.","New A4 document.","Tài liệu A4 mới."],
  ["Aucun document à exporter.","No document to export.","Không có tài liệu để xuất."],
  ["Bibliothèque d’export indisponible. Vérifiez la connexion.","Export library unavailable. Check your internet connection.","Không thể tải thư viện xuất PDF. Hãy kiểm tra kết nối mạng."],
  ["Préparation de l’export...","Preparing export…","Đang chuẩn bị xuất…"],
  ["fontkit indisponible : impossible d’incorporer {font}","fontkit unavailable: cannot embed {font}","Không có fontkit: không thể nhúng {font}"],
  ["Police non compatible avec certains caractères du bloc « {text} ». Importez un TTF/OTF Unicode.","Font cannot encode some characters in “{text}”. Import a Unicode TTF/OTF file.","Phông chữ không hỗ trợ một số ký tự trong “{text}”. Hãy nhập phông Unicode TTF/OTF."],
  ["PDF exporté : {name}","PDF exported: {name}","Đã xuất PDF: {name}"],
  ["PDF exporté. Les corrections sont visuelles et ne caviardent pas le contenu sous-jacent.","PDF exported. Visual replacements do not securely redact the underlying content.","Đã xuất PDF. Các phần thay thế trực quan không xóa an toàn nội dung gốc."],
  ["Erreur d’export : {error}","Export error: {error}","Lỗi xuất PDF: {error}"],
  ["Export impossible : {error}","Cannot export: {error}","Không thể xuất: {error}"],
  ["Seuls les fichiers TTF/OTF sont pris en charge.","Only TTF/OTF files are supported.","Chỉ hỗ trợ tệp TTF/OTF."],
  ["Police « {name} » importée : sera incorporée à l’export.","Font “{name}” imported: it will be embedded on export.","Đã nhập phông chữ “{name}”: sẽ được nhúng khi xuất."],
  ["Impossible de charger la police : {name}","Cannot load font: {name}","Không thể tải phông chữ: {name}"],
  ["Prêt — ouvrez un PDF ou créez une page blanche.","Ready — open a PDF or create a blank page.","Sẵn sàng — mở PDF hoặc tạo trang trắng."],
  ["Langue de l’interface mise à jour.","Interface language updated.","Đã thay đổi ngôn ngữ giao diện."]
];
const dictionaries = Object.fromEntries(rows.map(([fr,en,vi]) => [fr,{fr,en,vi}]));
const languages = ["fr","en","vi"];
const originals = new WeakMap();
const originalAttributes = new WeakMap();
const roots = ".header,.menubar,.toolbar,.sidebar,.empty-state,.inspector,.statusbar,#help-dialog";

function initialLanguage() {
  let saved = null;
  try { saved = window.localStorage.getItem("acrobait-language"); } catch { /* blocked storage */ }
  if (languages.includes(saved)) return saved;
  const browser = (navigator.languages?.[0] || navigator.language || "fr").toLowerCase().split("-")[0];
  return languages.includes(browser) ? browser : "en";
}

let currentLanguage = initialLanguage();
const subscribers = new Set();

export function getLanguage() { return currentLanguage; }
export function t(key, params = {}) {
  const value = dictionaries[key]?.[currentLanguage] ?? key;
  return value.replace(/\{([a-z]+)\}/g, (full, name) => String(params[name] ?? full));
}

function translateText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || parent.closest(".mi, .editable-text, .item-layer, .hit-layer, #thumbnails, #pages")) continue;
    if (!originals.has(node)) originals.set(node, node.textContent);
    const source = originals.get(node);
    const content = source.trim();
    if (!dictionaries[content]) continue;
    const whitespaceStart = source.slice(0, source.indexOf(content));
    const whitespaceEnd = source.slice(source.indexOf(content) + content.length);
    node.textContent = whitespaceStart + t(content) + whitespaceEnd;
  }
}

function translateAttributes(root) {
  for (const element of [root, ...root.querySelectorAll("[title], [aria-label], [placeholder]")]) {
    if (!originalAttributes.has(element)) originalAttributes.set(element, {});
    const saved = originalAttributes.get(element);
    for (const attr of ["title", "aria-label", "placeholder"]) {
      if (!element.hasAttribute(attr)) continue;
      if (!(attr in saved)) saved[attr] = element.getAttribute(attr);
      if (dictionaries[saved[attr]]) element.setAttribute(attr, t(saved[attr]));
    }
  }
}

export function translateInterface() {
  document.documentElement.lang = currentLanguage;
  document.title = t("aDaube Acrobait — éditeur PDF");
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = t("aDaube Acrobait — éditeur PDF gratuit, local et sans compte.");
  for (const root of document.querySelectorAll(roots)) {
    translateText(root);
    translateAttributes(root);
  }
  const select = document.getElementById("language");
  if (select) select.value = currentLanguage;
}

export function setLanguage(lang) {
  if (!languages.includes(lang)) return;
  currentLanguage = lang;
  try { window.localStorage.setItem("acrobait-language",lang); } catch { /* blocked storage */ }
  translateInterface();
  for (const subscriber of subscribers) subscriber(lang);
}

export function onLanguageChange(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}
