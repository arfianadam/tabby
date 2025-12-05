export type IconCategory =
  | "all"
  | "files"
  | "interface"
  | "business"
  | "communication"
  | "media"
  | "symbols"
  | "nature"
  | "travel"
  | "objects";

export type IconMetadata = {
  name: string;
  category: IconCategory;
  keywords: string[];
};

export const ICON_CATEGORIES: { id: IconCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "files", label: "Files" },
  { id: "interface", label: "Interface" },
  { id: "business", label: "Business" },
  { id: "communication", label: "Communication" },
  { id: "media", label: "Media" },
  { id: "symbols", label: "Symbols" },
  { id: "nature", label: "Nature" },
  { id: "travel", label: "Travel" },
  { id: "objects", label: "Objects" },
];

export const iconRegistry: IconMetadata[] = [
  // Files & Folders
  { name: "faFolder", category: "files", keywords: ["directory", "folder"] },
  {
    name: "faFolderOpen",
    category: "files",
    keywords: ["directory", "folder", "open"],
  },
  {
    name: "faFolderClosed",
    category: "files",
    keywords: ["directory", "folder", "closed"],
  },
  {
    name: "faFolderPlus",
    category: "files",
    keywords: ["directory", "folder", "add", "new"],
  },
  {
    name: "faFolderMinus",
    category: "files",
    keywords: ["directory", "folder", "remove"],
  },
  {
    name: "faFolderTree",
    category: "files",
    keywords: ["directory", "folder", "hierarchy"],
  },
  { name: "faFile", category: "files", keywords: ["document", "page"] },
  {
    name: "faFileLines",
    category: "files",
    keywords: ["document", "text", "page"],
  },
  {
    name: "faFilePdf",
    category: "files",
    keywords: ["document", "pdf", "adobe"],
  },
  {
    name: "faFileImage",
    category: "files",
    keywords: ["document", "picture", "photo"],
  },
  {
    name: "faFileCode",
    category: "files",
    keywords: ["document", "programming", "code"],
  },
  {
    name: "faFileZipper",
    category: "files",
    keywords: ["document", "archive", "zip", "compress"],
  },
  {
    name: "faFileAudio",
    category: "files",
    keywords: ["document", "music", "sound"],
  },
  {
    name: "faFileVideo",
    category: "files",
    keywords: ["document", "movie", "video"],
  },
  {
    name: "faFileExcel",
    category: "files",
    keywords: ["document", "spreadsheet", "excel"],
  },
  {
    name: "faFileWord",
    category: "files",
    keywords: ["document", "word", "microsoft"],
  },
  {
    name: "faFilePowerpoint",
    category: "files",
    keywords: ["document", "presentation", "powerpoint"],
  },
  {
    name: "faFileArrowDown",
    category: "files",
    keywords: ["document", "download"],
  },
  {
    name: "faFileArrowUp",
    category: "files",
    keywords: ["document", "upload"],
  },
  {
    name: "faFileExport",
    category: "files",
    keywords: ["document", "export", "share"],
  },
  { name: "faFileImport", category: "files", keywords: ["document", "import"] },
  {
    name: "faFileCsv",
    category: "files",
    keywords: ["document", "csv", "data"],
  },
  {
    name: "faFileContract",
    category: "files",
    keywords: ["document", "contract", "legal"],
  },
  {
    name: "faFileInvoice",
    category: "files",
    keywords: ["document", "invoice", "bill"],
  },
  {
    name: "faFileMedical",
    category: "files",
    keywords: ["document", "medical", "health"],
  },
  {
    name: "faFileSignature",
    category: "files",
    keywords: ["document", "signature", "sign"],
  },
  {
    name: "faFileShield",
    category: "files",
    keywords: ["document", "secure", "protected"],
  },
  {
    name: "faClipboard",
    category: "files",
    keywords: ["copy", "paste", "clipboard"],
  },
  {
    name: "faClipboardList",
    category: "files",
    keywords: ["list", "checklist", "tasks"],
  },
  {
    name: "faClipboardCheck",
    category: "files",
    keywords: ["done", "complete", "verified"],
  },
  { name: "faCopy", category: "files", keywords: ["duplicate", "copy"] },
  { name: "faPaste", category: "files", keywords: ["paste", "clipboard"] },
  {
    name: "faBoxArchive",
    category: "files",
    keywords: ["archive", "storage", "box"],
  },
  {
    name: "faDatabase",
    category: "files",
    keywords: ["data", "storage", "server"],
  },
  {
    name: "faServer",
    category: "files",
    keywords: ["hosting", "server", "computer"],
  },
  {
    name: "faHardDrive",
    category: "files",
    keywords: ["storage", "disk", "drive"],
  },
  {
    name: "faFloppyDisk",
    category: "files",
    keywords: ["save", "disk", "storage"],
  },
  {
    name: "faSdCard",
    category: "files",
    keywords: ["memory", "storage", "card"],
  },

  // Interface & Navigation
  {
    name: "faHome",
    category: "interface",
    keywords: ["house", "main", "start"],
  },
  {
    name: "faHouse",
    category: "interface",
    keywords: ["home", "main", "start"],
  },
  {
    name: "faHouseChimney",
    category: "interface",
    keywords: ["home", "house", "chimney"],
  },
  {
    name: "faMagnifyingGlass",
    category: "interface",
    keywords: ["search", "find", "zoom"],
  },
  {
    name: "faGear",
    category: "interface",
    keywords: ["settings", "cog", "config"],
  },
  {
    name: "faGears",
    category: "interface",
    keywords: ["settings", "cogs", "config"],
  },
  {
    name: "faSliders",
    category: "interface",
    keywords: ["settings", "options", "config"],
  },
  {
    name: "faBars",
    category: "interface",
    keywords: ["menu", "hamburger", "navigation"],
  },
  {
    name: "faEllipsis",
    category: "interface",
    keywords: ["more", "dots", "options"],
  },
  {
    name: "faEllipsisVertical",
    category: "interface",
    keywords: ["more", "dots", "options"],
  },
  { name: "faPlus", category: "interface", keywords: ["add", "new", "create"] },
  {
    name: "faMinus",
    category: "interface",
    keywords: ["remove", "subtract", "delete"],
  },
  {
    name: "faXmark",
    category: "interface",
    keywords: ["close", "cancel", "remove"],
  },
  {
    name: "faCheck",
    category: "interface",
    keywords: ["done", "complete", "yes"],
  },
  {
    name: "faChevronUp",
    category: "interface",
    keywords: ["arrow", "up", "expand"],
  },
  {
    name: "faChevronDown",
    category: "interface",
    keywords: ["arrow", "down", "collapse"],
  },
  {
    name: "faChevronLeft",
    category: "interface",
    keywords: ["arrow", "left", "back"],
  },
  {
    name: "faChevronRight",
    category: "interface",
    keywords: ["arrow", "right", "forward"],
  },
  {
    name: "faArrowUp",
    category: "interface",
    keywords: ["up", "arrow", "direction"],
  },
  {
    name: "faArrowDown",
    category: "interface",
    keywords: ["down", "arrow", "direction"],
  },
  {
    name: "faArrowLeft",
    category: "interface",
    keywords: ["left", "arrow", "back"],
  },
  {
    name: "faArrowRight",
    category: "interface",
    keywords: ["right", "arrow", "forward"],
  },
  {
    name: "faArrowsRotate",
    category: "interface",
    keywords: ["refresh", "reload", "sync"],
  },
  {
    name: "faRotate",
    category: "interface",
    keywords: ["refresh", "reload", "rotate"],
  },
  {
    name: "faRotateRight",
    category: "interface",
    keywords: ["redo", "rotate", "forward"],
  },
  {
    name: "faRotateLeft",
    category: "interface",
    keywords: ["undo", "rotate", "back"],
  },
  {
    name: "faExpand",
    category: "interface",
    keywords: ["fullscreen", "expand", "maximize"],
  },
  {
    name: "faCompress",
    category: "interface",
    keywords: ["minimize", "compress", "shrink"],
  },
  {
    name: "faMaximize",
    category: "interface",
    keywords: ["fullscreen", "maximize", "expand"],
  },
  {
    name: "faMinimize",
    category: "interface",
    keywords: ["minimize", "shrink", "reduce"],
  },
  {
    name: "faFilter",
    category: "interface",
    keywords: ["filter", "sort", "funnel"],
  },
  {
    name: "faSort",
    category: "interface",
    keywords: ["sort", "order", "arrange"],
  },
  {
    name: "faList",
    category: "interface",
    keywords: ["list", "items", "menu"],
  },
  {
    name: "faListUl",
    category: "interface",
    keywords: ["list", "bullets", "unordered"],
  },
  {
    name: "faListOl",
    category: "interface",
    keywords: ["list", "numbers", "ordered"],
  },
  {
    name: "faListCheck",
    category: "interface",
    keywords: ["list", "tasks", "checklist"],
  },
  {
    name: "faTableCells",
    category: "interface",
    keywords: ["grid", "table", "cells"],
  },
  {
    name: "faTableCellsLarge",
    category: "interface",
    keywords: ["grid", "table", "large"],
  },
  {
    name: "faGripVertical",
    category: "interface",
    keywords: ["drag", "handle", "move"],
  },
  {
    name: "faGripHorizontal",
    category: "interface",
    keywords: ["drag", "handle", "move"],
  },
  {
    name: "faGrip",
    category: "interface",
    keywords: ["drag", "handle", "move"],
  },
  {
    name: "faCircle",
    category: "interface",
    keywords: ["dot", "circle", "round"],
  },
  {
    name: "faCircleDot",
    category: "interface",
    keywords: ["radio", "bullet", "selected"],
  },
  {
    name: "faSquare",
    category: "interface",
    keywords: ["box", "square", "shape"],
  },
  {
    name: "faSquareCheck",
    category: "interface",
    keywords: ["checkbox", "done", "complete"],
  },
  {
    name: "faCircleCheck",
    category: "interface",
    keywords: ["done", "complete", "success"],
  },
  {
    name: "faCircleXmark",
    category: "interface",
    keywords: ["close", "cancel", "error"],
  },
  {
    name: "faCircleExclamation",
    category: "interface",
    keywords: ["warning", "alert", "attention"],
  },
  {
    name: "faCircleInfo",
    category: "interface",
    keywords: ["info", "information", "help"],
  },
  {
    name: "faCircleQuestion",
    category: "interface",
    keywords: ["help", "question", "support"],
  },
  {
    name: "faTriangleExclamation",
    category: "interface",
    keywords: ["warning", "alert", "danger"],
  },
  {
    name: "faEye",
    category: "interface",
    keywords: ["view", "visible", "show"],
  },
  {
    name: "faEyeSlash",
    category: "interface",
    keywords: ["hidden", "invisible", "hide"],
  },
  {
    name: "faLock",
    category: "interface",
    keywords: ["secure", "locked", "private"],
  },
  {
    name: "faLockOpen",
    category: "interface",
    keywords: ["unlock", "open", "public"],
  },
  {
    name: "faShield",
    category: "interface",
    keywords: ["security", "protection", "safe"],
  },
  {
    name: "faShieldHalved",
    category: "interface",
    keywords: ["security", "protection", "verified"],
  },
  {
    name: "faKey",
    category: "interface",
    keywords: ["password", "access", "unlock"],
  },
  {
    name: "faFingerprint",
    category: "interface",
    keywords: ["identity", "biometric", "security"],
  },
  {
    name: "faUserLock",
    category: "interface",
    keywords: ["user", "security", "locked"],
  },
  {
    name: "faPen",
    category: "interface",
    keywords: ["edit", "write", "modify"],
  },
  {
    name: "faPenToSquare",
    category: "interface",
    keywords: ["edit", "modify", "update"],
  },
  {
    name: "faPencil",
    category: "interface",
    keywords: ["edit", "write", "draw"],
  },
  {
    name: "faEraser",
    category: "interface",
    keywords: ["delete", "remove", "erase"],
  },
  {
    name: "faTrash",
    category: "interface",
    keywords: ["delete", "remove", "bin"],
  },
  {
    name: "faTrashCan",
    category: "interface",
    keywords: ["delete", "remove", "bin"],
  },
  {
    name: "faDownload",
    category: "interface",
    keywords: ["download", "save", "get"],
  },
  {
    name: "faUpload",
    category: "interface",
    keywords: ["upload", "send", "share"],
  },
  {
    name: "faCloudArrowUp",
    category: "interface",
    keywords: ["upload", "cloud", "sync"],
  },
  {
    name: "faCloudArrowDown",
    category: "interface",
    keywords: ["download", "cloud", "sync"],
  },
  {
    name: "faCloud",
    category: "interface",
    keywords: ["cloud", "storage", "online"],
  },
  {
    name: "faSpinner",
    category: "interface",
    keywords: ["loading", "spinner", "wait"],
  },
  {
    name: "faCircleNotch",
    category: "interface",
    keywords: ["loading", "spinner", "wait"],
  },
  {
    name: "faPowerOff",
    category: "interface",
    keywords: ["power", "off", "shutdown"],
  },
  {
    name: "faToggleOn",
    category: "interface",
    keywords: ["switch", "on", "enable"],
  },
  {
    name: "faToggleOff",
    category: "interface",
    keywords: ["switch", "off", "disable"],
  },
  {
    name: "faBell",
    category: "interface",
    keywords: ["notification", "alert", "bell"],
  },
  {
    name: "faBellSlash",
    category: "interface",
    keywords: ["mute", "silent", "notification"],
  },

  // Business & Commerce
  {
    name: "faBriefcase",
    category: "business",
    keywords: ["work", "job", "business"],
  },
  {
    name: "faBuilding",
    category: "business",
    keywords: ["office", "company", "business"],
  },
  {
    name: "faBuildingColumns",
    category: "business",
    keywords: ["bank", "finance", "institution"],
  },
  {
    name: "faLandmark",
    category: "business",
    keywords: ["government", "institution", "building"],
  },
  {
    name: "faIndustry",
    category: "business",
    keywords: ["factory", "manufacturing", "industry"],
  },
  {
    name: "faChartLine",
    category: "business",
    keywords: ["graph", "analytics", "growth"],
  },
  {
    name: "faChartBar",
    category: "business",
    keywords: ["graph", "analytics", "statistics"],
  },
  {
    name: "faChartPie",
    category: "business",
    keywords: ["graph", "analytics", "statistics"],
  },
  {
    name: "faChartArea",
    category: "business",
    keywords: ["graph", "analytics", "statistics"],
  },
  {
    name: "faChartSimple",
    category: "business",
    keywords: ["graph", "analytics", "statistics"],
  },
  {
    name: "faSquarePollVertical",
    category: "business",
    keywords: ["poll", "survey", "chart"],
  },
  {
    name: "faHandshake",
    category: "business",
    keywords: ["deal", "agreement", "partnership"],
  },
  {
    name: "faHandshakeAngle",
    category: "business",
    keywords: ["help", "support", "partnership"],
  },
  {
    name: "faDollarSign",
    category: "business",
    keywords: ["money", "currency", "dollar"],
  },
  {
    name: "faEuroSign",
    category: "business",
    keywords: ["money", "currency", "euro"],
  },
  {
    name: "faSterlingSign",
    category: "business",
    keywords: ["money", "currency", "pound"],
  },
  {
    name: "faYenSign",
    category: "business",
    keywords: ["money", "currency", "yen"],
  },
  {
    name: "faCoins",
    category: "business",
    keywords: ["money", "currency", "coins"],
  },
  {
    name: "faMoneyBill",
    category: "business",
    keywords: ["money", "cash", "bill"],
  },
  {
    name: "faMoneyBillWave",
    category: "business",
    keywords: ["money", "cash", "payment"],
  },
  {
    name: "faMoneyBillTrendUp",
    category: "business",
    keywords: ["money", "profit", "growth"],
  },
  {
    name: "faWallet",
    category: "business",
    keywords: ["money", "payment", "wallet"],
  },
  {
    name: "faCreditCard",
    category: "business",
    keywords: ["payment", "card", "credit"],
  },
  {
    name: "faReceipt",
    category: "business",
    keywords: ["bill", "receipt", "invoice"],
  },
  {
    name: "faCartShopping",
    category: "business",
    keywords: ["cart", "shopping", "buy"],
  },
  {
    name: "faBasketShopping",
    category: "business",
    keywords: ["basket", "shopping", "buy"],
  },
  {
    name: "faBagShopping",
    category: "business",
    keywords: ["bag", "shopping", "buy"],
  },
  {
    name: "faStore",
    category: "business",
    keywords: ["shop", "store", "retail"],
  },
  {
    name: "faShop",
    category: "business",
    keywords: ["shop", "store", "retail"],
  },
  { name: "faTag", category: "business", keywords: ["label", "tag", "price"] },
  {
    name: "faTags",
    category: "business",
    keywords: ["labels", "tags", "prices"],
  },
  {
    name: "faBarcode",
    category: "business",
    keywords: ["product", "scan", "code"],
  },
  { name: "faQrcode", category: "business", keywords: ["qr", "scan", "code"] },
  {
    name: "faPercent",
    category: "business",
    keywords: ["discount", "percent", "sale"],
  },
  {
    name: "faGift",
    category: "business",
    keywords: ["present", "gift", "reward"],
  },
  {
    name: "faAward",
    category: "business",
    keywords: ["award", "achievement", "badge"],
  },
  {
    name: "faMedal",
    category: "business",
    keywords: ["medal", "achievement", "award"],
  },
  {
    name: "faTrophy",
    category: "business",
    keywords: ["trophy", "winner", "award"],
  },
  {
    name: "faCrown",
    category: "business",
    keywords: ["crown", "king", "premium"],
  },
  {
    name: "faGem",
    category: "business",
    keywords: ["diamond", "gem", "premium"],
  },
  {
    name: "faScaleBalanced",
    category: "business",
    keywords: ["justice", "law", "balance"],
  },
  {
    name: "faGavel",
    category: "business",
    keywords: ["law", "judge", "auction"],
  },
  {
    name: "faCalculator",
    category: "business",
    keywords: ["math", "calculate", "numbers"],
  },
  {
    name: "faPiggyBank",
    category: "business",
    keywords: ["savings", "money", "bank"],
  },
  {
    name: "faVault",
    category: "business",
    keywords: ["safe", "security", "vault"],
  },
  {
    name: "faSackDollar",
    category: "business",
    keywords: ["money", "wealth", "bag"],
  },
  {
    name: "faMoneyCheckDollar",
    category: "business",
    keywords: ["check", "payment", "money"],
  },
  {
    name: "faFileInvoiceDollar",
    category: "business",
    keywords: ["invoice", "bill", "payment"],
  },
  {
    name: "faHandHoldingDollar",
    category: "business",
    keywords: ["payment", "donate", "money"],
  },

  // Communication
  {
    name: "faEnvelope",
    category: "communication",
    keywords: ["email", "mail", "message"],
  },
  {
    name: "faEnvelopeOpen",
    category: "communication",
    keywords: ["email", "read", "message"],
  },
  {
    name: "faPaperPlane",
    category: "communication",
    keywords: ["send", "message", "email"],
  },
  {
    name: "faInbox",
    category: "communication",
    keywords: ["inbox", "mail", "messages"],
  },
  {
    name: "faPhone",
    category: "communication",
    keywords: ["call", "phone", "contact"],
  },
  {
    name: "faPhoneVolume",
    category: "communication",
    keywords: ["call", "ringing", "phone"],
  },
  {
    name: "faMobile",
    category: "communication",
    keywords: ["mobile", "phone", "device"],
  },
  {
    name: "faMobileScreen",
    category: "communication",
    keywords: ["mobile", "phone", "screen"],
  },
  {
    name: "faComment",
    category: "communication",
    keywords: ["chat", "message", "comment"],
  },
  {
    name: "faComments",
    category: "communication",
    keywords: ["chat", "messages", "conversation"],
  },
  {
    name: "faCommentDots",
    category: "communication",
    keywords: ["chat", "typing", "message"],
  },
  {
    name: "faMessage",
    category: "communication",
    keywords: ["message", "chat", "text"],
  },
  {
    name: "faMessages",
    category: "communication",
    keywords: ["messages", "chat", "conversation"],
  },
  {
    name: "faQuoteLeft",
    category: "communication",
    keywords: ["quote", "citation", "speech"],
  },
  {
    name: "faQuoteRight",
    category: "communication",
    keywords: ["quote", "citation", "speech"],
  },
  {
    name: "faReply",
    category: "communication",
    keywords: ["reply", "respond", "answer"],
  },
  {
    name: "faReplyAll",
    category: "communication",
    keywords: ["reply", "all", "respond"],
  },
  {
    name: "faShare",
    category: "communication",
    keywords: ["share", "forward", "send"],
  },
  {
    name: "faShareNodes",
    category: "communication",
    keywords: ["share", "social", "network"],
  },
  {
    name: "faShareFromSquare",
    category: "communication",
    keywords: ["share", "export", "send"],
  },
  {
    name: "faAt",
    category: "communication",
    keywords: ["email", "at", "mention"],
  },
  {
    name: "faHashtag",
    category: "communication",
    keywords: ["hashtag", "tag", "social"],
  },
  {
    name: "faRss",
    category: "communication",
    keywords: ["feed", "rss", "subscribe"],
  },
  {
    name: "faBlog",
    category: "communication",
    keywords: ["blog", "write", "post"],
  },
  {
    name: "faNewspaper",
    category: "communication",
    keywords: ["news", "article", "press"],
  },
  {
    name: "faBullhorn",
    category: "communication",
    keywords: ["announce", "megaphone", "broadcast"],
  },
  {
    name: "faTowerBroadcast",
    category: "communication",
    keywords: ["broadcast", "radio", "signal"],
  },
  {
    name: "faSatelliteDish",
    category: "communication",
    keywords: ["satellite", "signal", "broadcast"],
  },
  {
    name: "faWifi",
    category: "communication",
    keywords: ["wifi", "wireless", "internet"],
  },
  {
    name: "faSignal",
    category: "communication",
    keywords: ["signal", "bars", "connection"],
  },
  {
    name: "faGlobe",
    category: "communication",
    keywords: ["world", "web", "internet"],
  },
  {
    name: "faEarthAmericas",
    category: "communication",
    keywords: ["world", "globe", "earth"],
  },
  {
    name: "faLanguage",
    category: "communication",
    keywords: ["language", "translate", "international"],
  },
  {
    name: "faVideo",
    category: "communication",
    keywords: ["video", "call", "camera"],
  },
  {
    name: "faVideoSlash",
    category: "communication",
    keywords: ["video", "off", "mute"],
  },
  {
    name: "faMicrophone",
    category: "communication",
    keywords: ["mic", "audio", "voice"],
  },
  {
    name: "faMicrophoneSlash",
    category: "communication",
    keywords: ["mute", "silent", "mic"],
  },
  {
    name: "faHeadset",
    category: "communication",
    keywords: ["headset", "support", "audio"],
  },
  {
    name: "faHeadphones",
    category: "communication",
    keywords: ["headphones", "audio", "music"],
  },

  // Media & Entertainment
  { name: "faPlay", category: "media", keywords: ["play", "start", "video"] },
  { name: "faPause", category: "media", keywords: ["pause", "stop", "break"] },
  { name: "faStop", category: "media", keywords: ["stop", "end", "halt"] },
  {
    name: "faForward",
    category: "media",
    keywords: ["forward", "skip", "next"],
  },
  {
    name: "faBackward",
    category: "media",
    keywords: ["backward", "skip", "previous"],
  },
  {
    name: "faForwardStep",
    category: "media",
    keywords: ["next", "skip", "forward"],
  },
  {
    name: "faBackwardStep",
    category: "media",
    keywords: ["previous", "skip", "backward"],
  },
  {
    name: "faForwardFast",
    category: "media",
    keywords: ["fast", "forward", "skip"],
  },
  {
    name: "faBackwardFast",
    category: "media",
    keywords: ["fast", "backward", "rewind"],
  },
  {
    name: "faVolumeHigh",
    category: "media",
    keywords: ["volume", "loud", "audio"],
  },
  {
    name: "faVolumeLow",
    category: "media",
    keywords: ["volume", "quiet", "audio"],
  },
  {
    name: "faVolumeOff",
    category: "media",
    keywords: ["mute", "silent", "volume"],
  },
  {
    name: "faVolumeXmark",
    category: "media",
    keywords: ["mute", "silent", "volume"],
  },
  { name: "faMusic", category: "media", keywords: ["music", "audio", "song"] },
  {
    name: "faRadio",
    category: "media",
    keywords: ["radio", "music", "broadcast"],
  },
  {
    name: "faRecordVinyl",
    category: "media",
    keywords: ["vinyl", "record", "music"],
  },
  {
    name: "faCompactDisc",
    category: "media",
    keywords: ["cd", "disc", "music"],
  },
  {
    name: "faGuitar",
    category: "media",
    keywords: ["guitar", "music", "instrument"],
  },
  {
    name: "faDrum",
    category: "media",
    keywords: ["drum", "music", "instrument"],
  },
  {
    name: "faImage",
    category: "media",
    keywords: ["image", "photo", "picture"],
  },
  {
    name: "faImages",
    category: "media",
    keywords: ["images", "photos", "gallery"],
  },
  {
    name: "faPhotoFilm",
    category: "media",
    keywords: ["photo", "film", "media"],
  },
  {
    name: "faCamera",
    category: "media",
    keywords: ["camera", "photo", "picture"],
  },
  {
    name: "faCameraRetro",
    category: "media",
    keywords: ["camera", "vintage", "photo"],
  },
  { name: "faFilm", category: "media", keywords: ["film", "movie", "video"] },
  {
    name: "faClapperboard",
    category: "media",
    keywords: ["movie", "film", "director"],
  },
  { name: "faTv", category: "media", keywords: ["tv", "television", "screen"] },
  {
    name: "faDisplay",
    category: "media",
    keywords: ["monitor", "screen", "display"],
  },
  {
    name: "faDesktop",
    category: "media",
    keywords: ["desktop", "computer", "monitor"],
  },
  {
    name: "faLaptop",
    category: "media",
    keywords: ["laptop", "computer", "device"],
  },
  {
    name: "faTablet",
    category: "media",
    keywords: ["tablet", "ipad", "device"],
  },
  {
    name: "faGamepad",
    category: "media",
    keywords: ["game", "controller", "play"],
  },
  { name: "faDice", category: "media", keywords: ["dice", "game", "random"] },
  {
    name: "faChess",
    category: "media",
    keywords: ["chess", "game", "strategy"],
  },
  {
    name: "faPuzzlePiece",
    category: "media",
    keywords: ["puzzle", "game", "piece"],
  },
  {
    name: "faMasksTheater",
    category: "media",
    keywords: ["theater", "drama", "masks"],
  },
  {
    name: "faTicket",
    category: "media",
    keywords: ["ticket", "event", "pass"],
  },
  {
    name: "faPopcorn",
    category: "media",
    keywords: ["popcorn", "movie", "snack"],
  },
  {
    name: "faPalette",
    category: "media",
    keywords: ["art", "color", "design"],
  },
  {
    name: "faPaintbrush",
    category: "media",
    keywords: ["paint", "art", "brush"],
  },
  { name: "faBrush", category: "media", keywords: ["brush", "paint", "art"] },
  {
    name: "faFillDrip",
    category: "media",
    keywords: ["fill", "paint", "color"],
  },
  {
    name: "faSwatchbook",
    category: "media",
    keywords: ["colors", "palette", "design"],
  },
  {
    name: "faDroplet",
    category: "media",
    keywords: ["drop", "water", "color"],
  },

  // Symbols & Shapes
  {
    name: "faStar",
    category: "symbols",
    keywords: ["star", "favorite", "rating"],
  },
  {
    name: "faStarHalfStroke",
    category: "symbols",
    keywords: ["star", "half", "rating"],
  },
  { name: "faHeart", category: "symbols", keywords: ["heart", "love", "like"] },
  {
    name: "faHeartCrack",
    category: "symbols",
    keywords: ["heart", "broken", "sad"],
  },
  {
    name: "faHeartPulse",
    category: "symbols",
    keywords: ["heart", "health", "pulse"],
  },
  {
    name: "faThumbsUp",
    category: "symbols",
    keywords: ["like", "approve", "thumbs"],
  },
  {
    name: "faThumbsDown",
    category: "symbols",
    keywords: ["dislike", "disapprove", "thumbs"],
  },
  {
    name: "faHandshake",
    category: "symbols",
    keywords: ["handshake", "deal", "agreement"],
  },
  {
    name: "faHandPeace",
    category: "symbols",
    keywords: ["peace", "hand", "victory"],
  },
  {
    name: "faHandPointUp",
    category: "symbols",
    keywords: ["point", "up", "finger"],
  },
  {
    name: "faHandPointRight",
    category: "symbols",
    keywords: ["point", "right", "finger"],
  },
  {
    name: "faBookmark",
    category: "symbols",
    keywords: ["bookmark", "save", "favorite"],
  },
  { name: "faFlag", category: "symbols", keywords: ["flag", "mark", "report"] },
  {
    name: "faFlagCheckered",
    category: "symbols",
    keywords: ["flag", "finish", "race"],
  },
  {
    name: "faBolt",
    category: "symbols",
    keywords: ["lightning", "power", "energy"],
  },
  { name: "faFire", category: "symbols", keywords: ["fire", "hot", "flame"] },
  {
    name: "faFireFlameCurved",
    category: "symbols",
    keywords: ["fire", "flame", "hot"],
  },
  {
    name: "faFireFlameSimple",
    category: "symbols",
    keywords: ["fire", "flame", "hot"],
  },
  {
    name: "faSnowflake",
    category: "symbols",
    keywords: ["snow", "winter", "cold"],
  },
  { name: "faSun", category: "symbols", keywords: ["sun", "day", "bright"] },
  { name: "faMoon", category: "symbols", keywords: ["moon", "night", "dark"] },
  {
    name: "faCloudSun",
    category: "symbols",
    keywords: ["weather", "partly", "cloudy"],
  },
  {
    name: "faCloudMoon",
    category: "symbols",
    keywords: ["weather", "night", "cloudy"],
  },
  {
    name: "faUmbrella",
    category: "symbols",
    keywords: ["umbrella", "rain", "weather"],
  },
  {
    name: "faBolt",
    category: "symbols",
    keywords: ["lightning", "thunder", "storm"],
  },
  {
    name: "faInfinity",
    category: "symbols",
    keywords: ["infinity", "forever", "endless"],
  },
  {
    name: "faPercentage",
    category: "symbols",
    keywords: ["percent", "discount", "rate"],
  },
  {
    name: "faHashtag",
    category: "symbols",
    keywords: ["hashtag", "number", "tag"],
  },
  {
    name: "faAsterisk",
    category: "symbols",
    keywords: ["asterisk", "star", "required"],
  },
  {
    name: "faCertificate",
    category: "symbols",
    keywords: ["certificate", "badge", "award"],
  },
  {
    name: "faRibbon",
    category: "symbols",
    keywords: ["ribbon", "award", "badge"],
  },
  { name: "faHand", category: "symbols", keywords: ["hand", "stop", "wave"] },
  {
    name: "faHandSparkles",
    category: "symbols",
    keywords: ["clean", "sanitize", "sparkles"],
  },
  {
    name: "faWandMagicSparkles",
    category: "symbols",
    keywords: ["magic", "wand", "sparkles"],
  },
  {
    name: "faWandSparkles",
    category: "symbols",
    keywords: ["magic", "wand", "sparkles"],
  },
  {
    name: "faSparkles",
    category: "symbols",
    keywords: ["sparkles", "new", "magic"],
  },
  {
    name: "faCrown",
    category: "symbols",
    keywords: ["crown", "king", "royal"],
  },
  {
    name: "faCircleHalfStroke",
    category: "symbols",
    keywords: ["contrast", "half", "circle"],
  },
  {
    name: "faYinYang",
    category: "symbols",
    keywords: ["yin", "yang", "balance"],
  },
  {
    name: "faOm",
    category: "symbols",
    keywords: ["om", "spiritual", "symbol"],
  },
  {
    name: "faPeace",
    category: "symbols",
    keywords: ["peace", "symbol", "love"],
  },
  {
    name: "faCross",
    category: "symbols",
    keywords: ["cross", "religious", "symbol"],
  },
  {
    name: "faStarOfDavid",
    category: "symbols",
    keywords: ["star", "jewish", "symbol"],
  },
  {
    name: "faStarAndCrescent",
    category: "symbols",
    keywords: ["islam", "muslim", "symbol"],
  },
  {
    name: "faDharmachakra",
    category: "symbols",
    keywords: ["buddhism", "wheel", "symbol"],
  },

  // Nature & Environment
  {
    name: "faTree",
    category: "nature",
    keywords: ["tree", "nature", "forest"],
  },
  { name: "faLeaf", category: "nature", keywords: ["leaf", "nature", "plant"] },
  {
    name: "aSeedling",
    category: "nature",
    keywords: ["plant", "grow", "seedling"],
  },
  {
    name: "faClover",
    category: "nature",
    keywords: ["clover", "luck", "nature"],
  },
  {
    name: "faCanadianMapleLeaf",
    category: "nature",
    keywords: ["maple", "leaf", "canada"],
  },
  {
    name: "faAppleWhole",
    category: "nature",
    keywords: ["apple", "fruit", "food"],
  },
  {
    name: "faLemon",
    category: "nature",
    keywords: ["lemon", "fruit", "citrus"],
  },
  {
    name: "faCarrot",
    category: "nature",
    keywords: ["carrot", "vegetable", "food"],
  },
  {
    name: "faPepperHot",
    category: "nature",
    keywords: ["pepper", "hot", "spicy"],
  },
  {
    name: "faWheatAwn",
    category: "nature",
    keywords: ["wheat", "grain", "farm"],
  },
  {
    name: "faFlower",
    category: "nature",
    keywords: ["flower", "plant", "nature"],
  },
  {
    name: "faFeather",
    category: "nature",
    keywords: ["feather", "bird", "light"],
  },
  {
    name: "faFeatherPointed",
    category: "nature",
    keywords: ["feather", "quill", "write"],
  },
  { name: "faPaw", category: "nature", keywords: ["paw", "pet", "animal"] },
  { name: "faDog", category: "nature", keywords: ["dog", "pet", "animal"] },
  { name: "faCat", category: "nature", keywords: ["cat", "pet", "animal"] },
  { name: "faFish", category: "nature", keywords: ["fish", "sea", "animal"] },
  { name: "faFishFins", category: "nature", keywords: ["fish", "fins", "sea"] },
  {
    name: "faShrimp",
    category: "nature",
    keywords: ["shrimp", "seafood", "animal"],
  },
  {
    name: "faOtter",
    category: "nature",
    keywords: ["otter", "animal", "cute"],
  },
  { name: "faDove", category: "nature", keywords: ["dove", "bird", "peace"] },
  { name: "faCrow", category: "nature", keywords: ["crow", "bird", "animal"] },
  {
    name: "faKiwiBird",
    category: "nature",
    keywords: ["kiwi", "bird", "animal"],
  },
  {
    name: "faDragon",
    category: "nature",
    keywords: ["dragon", "fantasy", "creature"],
  },
  {
    name: "faHorse",
    category: "nature",
    keywords: ["horse", "animal", "ride"],
  },
  {
    name: "faHippo",
    category: "nature",
    keywords: ["hippo", "animal", "africa"],
  },
  {
    name: "faFrog",
    category: "nature",
    keywords: ["frog", "animal", "amphibian"],
  },
  {
    name: "faSpider",
    category: "nature",
    keywords: ["spider", "insect", "bug"],
  },
  { name: "faBug", category: "nature", keywords: ["bug", "insect", "code"] },
  {
    name: "faLocust",
    category: "nature",
    keywords: ["locust", "insect", "bug"],
  },
  {
    name: "faMosquito",
    category: "nature",
    keywords: ["mosquito", "insect", "bug"],
  },
  { name: "faWorm", category: "nature", keywords: ["worm", "animal", "earth"] },
  {
    name: "faMountain",
    category: "nature",
    keywords: ["mountain", "nature", "outdoor"],
  },
  {
    name: "faMountainSun",
    category: "nature",
    keywords: ["mountain", "sun", "landscape"],
  },
  { name: "faWater", category: "nature", keywords: ["water", "wave", "ocean"] },
  {
    name: "faDroplet",
    category: "nature",
    keywords: ["water", "drop", "liquid"],
  },
  { name: "faTint", category: "nature", keywords: ["water", "drop", "liquid"] },
  {
    name: "faGlassWater",
    category: "nature",
    keywords: ["water", "glass", "drink"],
  },
  {
    name: "faBottleWater",
    category: "nature",
    keywords: ["water", "bottle", "drink"],
  },
  { name: "faWind", category: "nature", keywords: ["wind", "air", "weather"] },
  {
    name: "faTornado",
    category: "nature",
    keywords: ["tornado", "storm", "weather"],
  },
  {
    name: "faHurricane",
    category: "nature",
    keywords: ["hurricane", "storm", "weather"],
  },
  {
    name: "faCloudRain",
    category: "nature",
    keywords: ["rain", "weather", "cloud"],
  },
  {
    name: "faCloudShowersHeavy",
    category: "nature",
    keywords: ["rain", "storm", "weather"],
  },
  {
    name: "faCloudBolt",
    category: "nature",
    keywords: ["thunder", "storm", "lightning"],
  },
  {
    name: "faTemperatureHalf",
    category: "nature",
    keywords: ["temperature", "thermometer", "weather"],
  },
  {
    name: "faTemperatureHigh",
    category: "nature",
    keywords: ["hot", "temperature", "weather"],
  },
  {
    name: "faTemperatureLow",
    category: "nature",
    keywords: ["cold", "temperature", "weather"],
  },
  {
    name: "faRecycle",
    category: "nature",
    keywords: ["recycle", "environment", "green"],
  },

  // Travel & Transportation
  {
    name: "faPlane",
    category: "travel",
    keywords: ["plane", "airplane", "flight"],
  },
  {
    name: "faPlaneDeparture",
    category: "travel",
    keywords: ["departure", "takeoff", "flight"],
  },
  {
    name: "faPlaneArrival",
    category: "travel",
    keywords: ["arrival", "landing", "flight"],
  },
  {
    name: "faHelicopter",
    category: "travel",
    keywords: ["helicopter", "chopper", "flight"],
  },
  {
    name: "faJetFighter",
    category: "travel",
    keywords: ["jet", "fighter", "military"],
  },
  { name: "faCar", category: "travel", keywords: ["car", "vehicle", "drive"] },
  {
    name: "faCarSide",
    category: "travel",
    keywords: ["car", "vehicle", "auto"],
  },
  { name: "faTaxi", category: "travel", keywords: ["taxi", "cab", "ride"] },
  {
    name: "faBus",
    category: "travel",
    keywords: ["bus", "transit", "transport"],
  },
  {
    name: "faBusSimple",
    category: "travel",
    keywords: ["bus", "transit", "transport"],
  },
  {
    name: "faTrain",
    category: "travel",
    keywords: ["train", "rail", "transit"],
  },
  {
    name: "faTrainSubway",
    category: "travel",
    keywords: ["subway", "metro", "train"],
  },
  {
    name: "faTrainTram",
    category: "travel",
    keywords: ["tram", "transit", "train"],
  },
  {
    name: "faMotorcycle",
    category: "travel",
    keywords: ["motorcycle", "bike", "ride"],
  },
  {
    name: "faBicycle",
    category: "travel",
    keywords: ["bicycle", "bike", "cycle"],
  },
  {
    name: "faPersonBiking",
    category: "travel",
    keywords: ["cycling", "bike", "exercise"],
  },
  {
    name: "faPersonWalking",
    category: "travel",
    keywords: ["walking", "pedestrian", "walk"],
  },
  {
    name: "faPersonRunning",
    category: "travel",
    keywords: ["running", "exercise", "jog"],
  },
  { name: "faShip", category: "travel", keywords: ["ship", "boat", "cruise"] },
  {
    name: "faSailboat",
    category: "travel",
    keywords: ["sailboat", "boat", "sailing"],
  },
  {
    name: "faAnchor",
    category: "travel",
    keywords: ["anchor", "ship", "nautical"],
  },
  {
    name: "faRocket",
    category: "travel",
    keywords: ["rocket", "space", "launch"],
  },
  {
    name: "faSpaceShuttle",
    category: "travel",
    keywords: ["shuttle", "space", "nasa"],
  },
  {
    name: "faTruck",
    category: "travel",
    keywords: ["truck", "delivery", "shipping"],
  },
  {
    name: "faTruckFast",
    category: "travel",
    keywords: ["truck", "fast", "delivery"],
  },
  {
    name: "faVanShuttle",
    category: "travel",
    keywords: ["van", "shuttle", "transport"],
  },
  {
    name: "faCaravan",
    category: "travel",
    keywords: ["caravan", "rv", "camping"],
  },
  {
    name: "faCampground",
    category: "travel",
    keywords: ["camping", "tent", "outdoor"],
  },
  {
    name: "faTent",
    category: "travel",
    keywords: ["tent", "camping", "outdoor"],
  },
  {
    name: "faCompass",
    category: "travel",
    keywords: ["compass", "navigation", "direction"],
  },
  {
    name: "faMap",
    category: "travel",
    keywords: ["map", "navigation", "location"],
  },
  {
    name: "faMapLocationDot",
    category: "travel",
    keywords: ["map", "location", "pin"],
  },
  {
    name: "faLocationDot",
    category: "travel",
    keywords: ["location", "pin", "marker"],
  },
  {
    name: "faLocationPin",
    category: "travel",
    keywords: ["location", "pin", "marker"],
  },
  {
    name: "faLocationArrow",
    category: "travel",
    keywords: ["location", "arrow", "direction"],
  },
  {
    name: "faRoute",
    category: "travel",
    keywords: ["route", "path", "navigation"],
  },
  {
    name: "faDiamondTurnRight",
    category: "travel",
    keywords: ["turn", "direction", "road"],
  },
  { name: "faRoad", category: "travel", keywords: ["road", "street", "path"] },
  {
    name: "faBridge",
    category: "travel",
    keywords: ["bridge", "road", "crossing"],
  },
  {
    name: "faPassport",
    category: "travel",
    keywords: ["passport", "travel", "document"],
  },
  {
    name: "faSuitcase",
    category: "travel",
    keywords: ["suitcase", "luggage", "travel"],
  },
  {
    name: "faSuitcaseRolling",
    category: "travel",
    keywords: ["luggage", "rolling", "travel"],
  },
  {
    name: "faUmbrellaBeach",
    category: "travel",
    keywords: ["beach", "umbrella", "vacation"],
  },
  {
    name: "faMountainCity",
    category: "travel",
    keywords: ["mountain", "city", "landscape"],
  },
  {
    name: "faHotel",
    category: "travel",
    keywords: ["hotel", "lodging", "accommodation"],
  },
  { name: "faBed", category: "travel", keywords: ["bed", "sleep", "hotel"] },
  {
    name: "faEarthAfrica",
    category: "travel",
    keywords: ["earth", "africa", "globe"],
  },
  {
    name: "faEarthAsia",
    category: "travel",
    keywords: ["earth", "asia", "globe"],
  },
  {
    name: "faEarthEurope",
    category: "travel",
    keywords: ["earth", "europe", "globe"],
  },
  {
    name: "faEarthOceania",
    category: "travel",
    keywords: ["earth", "oceania", "globe"],
  },

  // Objects & Items
  {
    name: "faLightbulb",
    category: "objects",
    keywords: ["idea", "light", "bulb"],
  },
  {
    name: "faLaptopCode",
    category: "objects",
    keywords: ["code", "laptop", "programming"],
  },
  {
    name: "faCode",
    category: "objects",
    keywords: ["code", "programming", "dev"],
  },
  {
    name: "faCodeBranch",
    category: "objects",
    keywords: ["git", "branch", "code"],
  },
  {
    name: "faCodeCommit",
    category: "objects",
    keywords: ["git", "commit", "code"],
  },
  {
    name: "faCodeMerge",
    category: "objects",
    keywords: ["git", "merge", "code"],
  },
  {
    name: "faCodePullRequest",
    category: "objects",
    keywords: ["git", "pr", "code"],
  },
  {
    name: "faCodeFork",
    category: "objects",
    keywords: ["git", "fork", "code"],
  },
  {
    name: "faTerminal",
    category: "objects",
    keywords: ["terminal", "command", "cli"],
  },
  {
    name: "faKeyboard",
    category: "objects",
    keywords: ["keyboard", "type", "input"],
  },
  {
    name: "faMouse",
    category: "objects",
    keywords: ["mouse", "cursor", "click"],
  },
  {
    name: "faPrint",
    category: "objects",
    keywords: ["print", "printer", "paper"],
  },
  {
    name: "faFax",
    category: "objects",
    keywords: ["fax", "machine", "office"],
  },
  {
    name: "faPlugCircleBolt",
    category: "objects",
    keywords: ["plug", "power", "electric"],
  },
  {
    name: "faPlug",
    category: "objects",
    keywords: ["plug", "power", "connect"],
  },
  {
    name: "faBatteryFull",
    category: "objects",
    keywords: ["battery", "full", "power"],
  },
  {
    name: "faBatteryHalf",
    category: "objects",
    keywords: ["battery", "half", "power"],
  },
  {
    name: "faBatteryEmpty",
    category: "objects",
    keywords: ["battery", "empty", "power"],
  },
  {
    name: "faBook",
    category: "objects",
    keywords: ["book", "read", "library"],
  },
  {
    name: "faBookOpen",
    category: "objects",
    keywords: ["book", "open", "read"],
  },
  {
    name: "faBookOpenReader",
    category: "objects",
    keywords: ["book", "read", "study"],
  },
  {
    name: "faBookBookmark",
    category: "objects",
    keywords: ["book", "bookmark", "read"],
  },
  {
    name: "faBookAtlas",
    category: "objects",
    keywords: ["atlas", "map", "book"],
  },
  {
    name: "faBookBible",
    category: "objects",
    keywords: ["bible", "book", "religious"],
  },
  {
    name: "faBookMedical",
    category: "objects",
    keywords: ["medical", "book", "health"],
  },
  {
    name: "faGraduationCap",
    category: "objects",
    keywords: ["graduation", "education", "school"],
  },
  {
    name: "faSchool",
    category: "objects",
    keywords: ["school", "education", "building"],
  },
  {
    name: "faChalkboard",
    category: "objects",
    keywords: ["chalkboard", "teach", "school"],
  },
  {
    name: "faChalkboardUser",
    category: "objects",
    keywords: ["teacher", "teach", "school"],
  },
  {
    name: "faAppleWhole",
    category: "objects",
    keywords: ["apple", "fruit", "teacher"],
  },
  {
    name: "faRuler",
    category: "objects",
    keywords: ["ruler", "measure", "tool"],
  },
  {
    name: "faRulerCombined",
    category: "objects",
    keywords: ["ruler", "measure", "tool"],
  },
  {
    name: "faScissors",
    category: "objects",
    keywords: ["scissors", "cut", "tool"],
  },
  {
    name: "faPaperclip",
    category: "objects",
    keywords: ["paperclip", "attach", "office"],
  },
  {
    name: "faThumbsUp",
    category: "objects",
    keywords: ["thumbs", "up", "like"],
  },
  {
    name: "faThumbsDown",
    category: "objects",
    keywords: ["thumbs", "down", "dislike"],
  },
  {
    name: "faFaceSmile",
    category: "objects",
    keywords: ["smile", "happy", "emoji"],
  },
  {
    name: "faFaceFrown",
    category: "objects",
    keywords: ["frown", "sad", "emoji"],
  },
  {
    name: "faFaceMeh",
    category: "objects",
    keywords: ["meh", "neutral", "emoji"],
  },
  {
    name: "faFaceGrinWide",
    category: "objects",
    keywords: ["grin", "happy", "emoji"],
  },
  {
    name: "faFaceLaugh",
    category: "objects",
    keywords: ["laugh", "happy", "emoji"],
  },
  {
    name: "faFaceGrimace",
    category: "objects",
    keywords: ["grimace", "awkward", "emoji"],
  },
  {
    name: "faUser",
    category: "objects",
    keywords: ["user", "person", "account"],
  },
  {
    name: "faUsers",
    category: "objects",
    keywords: ["users", "people", "group"],
  },
  {
    name: "faUserGroup",
    category: "objects",
    keywords: ["users", "group", "team"],
  },
  { name: "faUserPlus", category: "objects", keywords: ["user", "add", "new"] },
  {
    name: "faUserMinus",
    category: "objects",
    keywords: ["user", "remove", "delete"],
  },
  {
    name: "faUserCheck",
    category: "objects",
    keywords: ["user", "verified", "approved"],
  },
  {
    name: "faUserXmark",
    category: "objects",
    keywords: ["user", "remove", "delete"],
  },
  {
    name: "faUserGear",
    category: "objects",
    keywords: ["user", "settings", "config"],
  },
  {
    name: "faUserTie",
    category: "objects",
    keywords: ["user", "business", "professional"],
  },
  {
    name: "faUserDoctor",
    category: "objects",
    keywords: ["doctor", "medical", "health"],
  },
  {
    name: "faUserNurse",
    category: "objects",
    keywords: ["nurse", "medical", "health"],
  },
  {
    name: "faUserGraduate",
    category: "objects",
    keywords: ["graduate", "student", "education"],
  },
  {
    name: "faUserSecret",
    category: "objects",
    keywords: ["spy", "secret", "agent"],
  },
  {
    name: "faUserAstronaut",
    category: "objects",
    keywords: ["astronaut", "space", "nasa"],
  },
  {
    name: "faUserNinja",
    category: "objects",
    keywords: ["ninja", "stealth", "warrior"],
  },
  {
    name: "faPeopleGroup",
    category: "objects",
    keywords: ["group", "team", "people"],
  },
  {
    name: "faPeopleArrows",
    category: "objects",
    keywords: ["distance", "social", "people"],
  },
  {
    name: "faPersonChalkboard",
    category: "objects",
    keywords: ["teacher", "present", "school"],
  },
  {
    name: "faHouseUser",
    category: "objects",
    keywords: ["home", "user", "house"],
  },
  {
    name: "faClock",
    category: "objects",
    keywords: ["clock", "time", "watch"],
  },
  {
    name: "faCalendar",
    category: "objects",
    keywords: ["calendar", "date", "schedule"],
  },
  {
    name: "faCalendarDays",
    category: "objects",
    keywords: ["calendar", "days", "schedule"],
  },
  {
    name: "faCalendarCheck",
    category: "objects",
    keywords: ["calendar", "event", "done"],
  },
  {
    name: "faCalendarPlus",
    category: "objects",
    keywords: ["calendar", "add", "event"],
  },
  {
    name: "faCalendarMinus",
    category: "objects",
    keywords: ["calendar", "remove", "event"],
  },
  {
    name: "faCalendarXmark",
    category: "objects",
    keywords: ["calendar", "cancel", "event"],
  },
  {
    name: "faStopwatch",
    category: "objects",
    keywords: ["stopwatch", "timer", "time"],
  },
  {
    name: "faHourglass",
    category: "objects",
    keywords: ["hourglass", "time", "wait"],
  },
  {
    name: "faHourglassHalf",
    category: "objects",
    keywords: ["hourglass", "time", "half"],
  },
  {
    name: "faHourglassEnd",
    category: "objects",
    keywords: ["hourglass", "time", "end"],
  },
  {
    name: "faUtensils",
    category: "objects",
    keywords: ["utensils", "food", "restaurant"],
  },
  { name: "faMugHot", category: "objects", keywords: ["mug", "coffee", "hot"] },
  {
    name: "faMugSaucer",
    category: "objects",
    keywords: ["coffee", "tea", "cup"],
  },
  {
    name: "faWineGlass",
    category: "objects",
    keywords: ["wine", "glass", "drink"],
  },
  {
    name: "faMartiniGlass",
    category: "objects",
    keywords: ["martini", "cocktail", "drink"],
  },
  {
    name: "faBeer",
    category: "objects",
    keywords: ["beer", "drink", "alcohol"],
  },
  {
    name: "faWhiskeyGlass",
    category: "objects",
    keywords: ["whiskey", "drink", "alcohol"],
  },
  {
    name: "faCookie",
    category: "objects",
    keywords: ["cookie", "food", "snack"],
  },
  {
    name: "faCookieBite",
    category: "objects",
    keywords: ["cookie", "bite", "snack"],
  },
  {
    name: "faPizzaSlice",
    category: "objects",
    keywords: ["pizza", "food", "slice"],
  },
  {
    name: "faBurger",
    category: "objects",
    keywords: ["burger", "food", "fast"],
  },
  {
    name: "faHotdog",
    category: "objects",
    keywords: ["hotdog", "food", "fast"],
  },
  {
    name: "faIceCream",
    category: "objects",
    keywords: ["ice", "cream", "dessert"],
  },
  {
    name: "faCake",
    category: "objects",
    keywords: ["cake", "birthday", "dessert"],
  },
  {
    name: "faBirthdayCake",
    category: "objects",
    keywords: ["birthday", "cake", "celebration"],
  },
  {
    name: "faCouch",
    category: "objects",
    keywords: ["couch", "sofa", "furniture"],
  },
  {
    name: "faChair",
    category: "objects",
    keywords: ["chair", "seat", "furniture"],
  },
  {
    name: "faHammer",
    category: "objects",
    keywords: ["hammer", "tool", "build"],
  },
  {
    name: "faWrench",
    category: "objects",
    keywords: ["wrench", "tool", "repair"],
  },
  {
    name: "faScrewdriver",
    category: "objects",
    keywords: ["screwdriver", "tool", "repair"],
  },
  {
    name: "faScrewdriverWrench",
    category: "objects",
    keywords: ["tools", "repair", "fix"],
  },
  {
    name: "faToolbox",
    category: "objects",
    keywords: ["toolbox", "tools", "repair"],
  },
  {
    name: "faMagnet",
    category: "objects",
    keywords: ["magnet", "attract", "magnetic"],
  },
  { name: "faGem", category: "objects", keywords: ["gem", "diamond", "jewel"] },
  {
    name: "faRing",
    category: "objects",
    keywords: ["ring", "jewelry", "wedding"],
  },
  {
    name: "faGlasses",
    category: "objects",
    keywords: ["glasses", "eyewear", "vision"],
  },
  {
    name: "faSunglasses",
    category: "objects",
    keywords: ["sunglasses", "cool", "sun"],
  },
  {
    name: "faShirt",
    category: "objects",
    keywords: ["shirt", "clothing", "fashion"],
  },
  {
    name: "faSocks",
    category: "objects",
    keywords: ["socks", "clothing", "feet"],
  },
  {
    name: "faHatCowboy",
    category: "objects",
    keywords: ["hat", "cowboy", "western"],
  },
  {
    name: "faHatWizard",
    category: "objects",
    keywords: ["hat", "wizard", "magic"],
  },
  {
    name: "faCrown",
    category: "objects",
    keywords: ["crown", "king", "royal"],
  },
  {
    name: "faUmbrella",
    category: "objects",
    keywords: ["umbrella", "rain", "weather"],
  },
  {
    name: "faBriefcaseMedical",
    category: "objects",
    keywords: ["medical", "briefcase", "health"],
  },
  {
    name: "faKitMedical",
    category: "objects",
    keywords: ["medical", "kit", "health"],
  },
  {
    name: "faBandage",
    category: "objects",
    keywords: ["bandage", "medical", "wound"],
  },
  {
    name: "faCapsules",
    category: "objects",
    keywords: ["pills", "medicine", "health"],
  },
  {
    name: "faPills",
    category: "objects",
    keywords: ["pills", "medicine", "health"],
  },
  {
    name: "faSyringe",
    category: "objects",
    keywords: ["syringe", "injection", "medical"],
  },
  {
    name: "faStethoscope",
    category: "objects",
    keywords: ["stethoscope", "doctor", "medical"],
  },
  {
    name: "faHeartbeat",
    category: "objects",
    keywords: ["heartbeat", "health", "pulse"],
  },
  {
    name: "faDna",
    category: "objects",
    keywords: ["dna", "science", "genetics"],
  },
  {
    name: "faVirus",
    category: "objects",
    keywords: ["virus", "health", "disease"],
  },
  {
    name: "faBacteria",
    category: "objects",
    keywords: ["bacteria", "health", "disease"],
  },
  {
    name: "faAtom",
    category: "objects",
    keywords: ["atom", "science", "physics"],
  },
  {
    name: "faMicroscope",
    category: "objects",
    keywords: ["microscope", "science", "lab"],
  },
  {
    name: "faFlask",
    category: "objects",
    keywords: ["flask", "science", "lab"],
  },
  { name: "faVial", category: "objects", keywords: ["vial", "science", "lab"] },
  {
    name: "faMagnifyingGlassChart",
    category: "objects",
    keywords: ["analysis", "chart", "search"],
  },
  {
    name: "faBrain",
    category: "objects",
    keywords: ["brain", "mind", "intelligence"],
  },
  {
    name: "faRobot",
    category: "objects",
    keywords: ["robot", "ai", "automation"],
  },
  {
    name: "faGhost",
    category: "objects",
    keywords: ["ghost", "halloween", "spooky"],
  },
  {
    name: "faSkull",
    category: "objects",
    keywords: ["skull", "death", "danger"],
  },
  {
    name: "faSkullCrossbones",
    category: "objects",
    keywords: ["skull", "danger", "poison"],
  },
  {
    name: "faBone",
    category: "objects",
    keywords: ["bone", "skeleton", "dog"],
  },
  {
    name: "faTooth",
    category: "objects",
    keywords: ["tooth", "dental", "teeth"],
  },
  {
    name: "faLungs",
    category: "objects",
    keywords: ["lungs", "breath", "health"],
  },
  { name: "faEar", category: "objects", keywords: ["ear", "hear", "listen"] },
  {
    name: "faHandHoldingHeart",
    category: "objects",
    keywords: ["care", "love", "charity"],
  },
  {
    name: "faHandsHolding",
    category: "objects",
    keywords: ["hands", "hold", "support"],
  },
  {
    name: "faHandsHoldingChild",
    category: "objects",
    keywords: ["child", "care", "family"],
  },
  {
    name: "faHandshakeSimple",
    category: "objects",
    keywords: ["handshake", "deal", "agreement"],
  },
  {
    name: "faChildren",
    category: "objects",
    keywords: ["children", "kids", "family"],
  },
  {
    name: "faBaby",
    category: "objects",
    keywords: ["baby", "infant", "child"],
  },
  {
    name: "faBabyCarriage",
    category: "objects",
    keywords: ["baby", "carriage", "stroller"],
  },
  {
    name: "faPersonPregnant",
    category: "objects",
    keywords: ["pregnant", "mother", "baby"],
  },
];

export const getIconsByCategory = (category: IconCategory): IconMetadata[] => {
  if (category === "all") {
    return iconRegistry;
  }
  return iconRegistry.filter((icon) => icon.category === category);
};

export const searchIcons = (
  query: string,
  category: IconCategory = "all",
): IconMetadata[] => {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) {
    return getIconsByCategory(category);
  }

  const icons = getIconsByCategory(category);
  return icons.filter((icon) => {
    const nameMatch = icon.name.toLowerCase().includes(normalizedQuery);
    const keywordMatch = icon.keywords.some((keyword) =>
      keyword.toLowerCase().includes(normalizedQuery),
    );
    return nameMatch || keywordMatch;
  });
};
