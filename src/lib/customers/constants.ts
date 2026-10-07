// The pick-lists and fixed rules of the Customer form (Zoho Books "New Customer"): shared by the server and the browser, no server-only imports.

// Customer Number: CUS-01151. The running number is the Counter "customer".
export const CUSTOMER_PREFIX = "CUS-";
export const CUSTOMER_DIGITS = 5;
export const CUSTOMER_COUNTER = "customer";
export const formatCustomerCode = (n: number) => `${CUSTOMER_PREFIX}${String(n).padStart(CUSTOMER_DIGITS, "0")}`;

// The ids of the options are what is stored in the Customer table, so they read as plain text (or as short names for the longer lists)
export const CUSTOMER_TYPES = ["Business", "Individual"];
export const SALUTATIONS = ["Mr.", "Mrs.", "Ms.", "Miss", "Dr."];
export const LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Gujarati", "Bengali", "Punjabi", "Urdu", "Odia", "Assamese",
  "Arabic", "French", "German", "Spanish", "Portuguese", "Chinese", "Japanese",
];
export const DEFAULT_LANGUAGE = "English";

export const TAX_PREFERENCES: { id: string; label: string }[] = [{ id: "taxable", label: "Taxable" }, { id: "exempt", label: "Tax Exempt" }];

export const CURRENCIES: { id: string; label: string }[] = [
  { id: "INR", label: "INR- Indian Rupee" }, { id: "USD", label: "USD- United States Dollar" }, { id: "EUR", label: "EUR- Euro" },
  { id: "GBP", label: "GBP- British Pound Sterling" }, { id: "AED", label: "AED- United Arab Emirates Dirham" }, { id: "SGD", label: "SGD- Singapore Dollar" },
  { id: "SAR", label: "SAR- Saudi Riyal" }, { id: "AUD", label: "AUD- Australian Dollar" }, { id: "CAD", label: "CAD- Canadian Dollar" },
  { id: "JPY", label: "JPY- Japanese Yen" }, { id: "CNY", label: "CNY- Chinese Yuan" },
];
export const DEFAULT_CURRENCY = "INR";

export const PAYMENT_TERMS: { id: string; label: string }[] = [
  { id: "due_on_receipt", label: "Due on Receipt" }, { id: "net_15", label: "Net 15" }, { id: "net_30", label: "Net 30" }, { id: "net_45", label: "Net 45" },
  { id: "net_60", label: "Net 60" }, { id: "due_end_of_month", label: "Due end of the month" }, { id: "due_end_of_next_month", label: "Due end of next month" },
];
export const DEFAULT_PAYMENT_TERMS = "due_on_receipt";

export const ACCOUNTS_RECEIVABLE: { id: string; label: string }[] = [{ id: "accounts_receivable", label: "Accounts Receivable" }];

// The letters of the states of India as they are written in "[TN] - Tamil Nadu", by GST state code
export const GST_STATE_ABBR: Record<string, string> = {
  "01": "JK", "02": "HP", "03": "PB", "04": "CH", "05": "UK", "06": "HR", "07": "DL", "08": "RJ", "09": "UP", "10": "BR", "11": "SK", "12": "AR",
  "13": "NL", "14": "MN", "15": "MZ", "16": "TR", "17": "ML", "18": "AS", "19": "WB", "20": "JH", "21": "OD", "22": "CG", "23": "MP", "24": "GJ",
  "26": "DN", "27": "MH", "29": "KA", "30": "GA", "31": "LD", "32": "KL", "33": "TN", "34": "PY", "35": "AN", "36": "TS", "37": "AP", "38": "LA",
};
// The business is in Tamil Nadu: a Consumer is supplied from there
export const HOME_STATE_CODE = "33";

export const DEFAULT_COUNTRY = "India";
export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
  "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad",
  "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica",
  "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
  "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan",
  "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Macau", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka",
  "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

// Country codes of the phone boxes (the code is stored in front of the number: +919876543210)
export const DEFAULT_PHONE_CODE = "+91";
export const PHONE_CODES: { code: string; country: string }[] = [
  { code: "+91", country: "India" }, { code: "+1", country: "United States / Canada" }, { code: "+44", country: "United Kingdom" },
  { code: "+971", country: "United Arab Emirates" }, { code: "+966", country: "Saudi Arabia" }, { code: "+974", country: "Qatar" }, { code: "+965", country: "Kuwait" },
  { code: "+968", country: "Oman" }, { code: "+973", country: "Bahrain" }, { code: "+65", country: "Singapore" }, { code: "+60", country: "Malaysia" },
  { code: "+61", country: "Australia" }, { code: "+64", country: "New Zealand" }, { code: "+94", country: "Sri Lanka" }, { code: "+977", country: "Nepal" },
  { code: "+880", country: "Bangladesh" }, { code: "+92", country: "Pakistan" }, { code: "+93", country: "Afghanistan" }, { code: "+975", country: "Bhutan" },
  { code: "+960", country: "Maldives" }, { code: "+95", country: "Myanmar" }, { code: "+66", country: "Thailand" }, { code: "+84", country: "Vietnam" },
  { code: "+62", country: "Indonesia" }, { code: "+63", country: "Philippines" }, { code: "+81", country: "Japan" }, { code: "+82", country: "South Korea" },
  { code: "+86", country: "China" }, { code: "+852", country: "Hong Kong" }, { code: "+853", country: "Macau" }, { code: "+886", country: "Taiwan" },
  { code: "+49", country: "Germany" }, { code: "+33", country: "France" }, { code: "+39", country: "Italy" }, { code: "+34", country: "Spain" },
  { code: "+31", country: "Netherlands" }, { code: "+32", country: "Belgium" }, { code: "+41", country: "Switzerland" }, { code: "+43", country: "Austria" },
  { code: "+46", country: "Sweden" }, { code: "+47", country: "Norway" }, { code: "+45", country: "Denmark" }, { code: "+358", country: "Finland" },
  { code: "+353", country: "Ireland" }, { code: "+351", country: "Portugal" }, { code: "+30", country: "Greece" }, { code: "+48", country: "Poland" },
  { code: "+420", country: "Czechia" }, { code: "+36", country: "Hungary" }, { code: "+40", country: "Romania" }, { code: "+7", country: "Russia" },
  { code: "+380", country: "Ukraine" }, { code: "+90", country: "Turkey" }, { code: "+20", country: "Egypt" }, { code: "+27", country: "South Africa" },
  { code: "+234", country: "Nigeria" }, { code: "+254", country: "Kenya" }, { code: "+255", country: "Tanzania" }, { code: "+256", country: "Uganda" },
  { code: "+233", country: "Ghana" }, { code: "+212", country: "Morocco" }, { code: "+213", country: "Algeria" }, { code: "+216", country: "Tunisia" },
  { code: "+251", country: "Ethiopia" }, { code: "+230", country: "Mauritius" }, { code: "+52", country: "Mexico" }, { code: "+55", country: "Brazil" },
  { code: "+54", country: "Argentina" }, { code: "+56", country: "Chile" }, { code: "+57", country: "Colombia" }, { code: "+51", country: "Peru" },
  { code: "+58", country: "Venezuela" }, { code: "+972", country: "Israel" }, { code: "+962", country: "Jordan" }, { code: "+961", country: "Lebanon" },
  { code: "+98", country: "Iran" }, { code: "+964", country: "Iraq" },
];
