// A practical (not exhaustive) list of Pakistani cities grouped by province/territory.
// Used to power the searchable city picker on case submission.

export const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
  "Islamabad Capital Territory",
] as const;

export type PakistanProvince = (typeof PAKISTAN_PROVINCES)[number];

export const PAKISTAN_CITIES_BY_PROVINCE: Record<PakistanProvince, string[]> = {
  Punjab: [
    "Lahore", "Rawalpindi", "Faisalabad", "Multan", "Gujranwala", "Sialkot", "Bahawalpur",
    "Sargodha", "Sheikhupura", "Jhang", "Rahim Yar Khan", "Gujrat", "Kasur", "Okara",
    "Sahiwal", "Wah Cantonment", "Dera Ghazi Khan", "Mianwali", "Muzaffargarh", "Vehari",
    "Chiniot", "Kamoke", "Hafizabad", "Jhelum", "Attock", "Bahawalnagar", "Khanewal",
    "Toba Tek Singh", "Narowal", "Pakpattan", "Chakwal", "Layyah", "Mandi Bahauddin",
    "Nankana Sahib", "Khushab", "Bhakkar", "Lodhran", "Rajanpur", "Taxila", "Gojra",
    "Kot Addu", "Murree", "Arifwala", "Burewala", "Daska", "Kabirwala", "Kamalia",
  ],
  Sindh: [
    "Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah", "Mirpur Khas", "Jacobabad",
    "Shikarpur", "Khairpur", "Dadu", "Thatta", "Badin", "Tando Adam", "Tando Allahyar",
    "Sanghar", "Umerkot", "Ghotki", "Kashmore", "Naushahro Feroze", "Matiari", "Jamshoro",
    "Kandhkot", "Ranipur", "Kotri",
  ],
  "Khyber Pakhtunkhwa": [
    "Peshawar", "Mardan", "Mingora (Swat)", "Kohat", "Abbottabad", "Dera Ismail Khan",
    "Bannu", "Swabi", "Nowshera", "Charsadda", "Mansehra", "Haripur", "Karak", "Chitral",
    "Batkhela", "Timergara", "Tank", "Lakki Marwat", "Hangu", "Buner", "Shangla",
  ],
  Balochistan: [
    "Quetta", "Gwadar", "Turbat", "Khuzdar", "Hub", "Chaman", "Sibi", "Zhob", "Loralai",
    "Dera Murad Jamali", "Dera Allah Yar", "Usta Muhammad", "Mastung", "Kalat", "Pasni",
    "Nushki", "Panjgur",
  ],
  "Gilgit-Baltistan": [
    "Gilgit", "Skardu", "Hunza", "Ghanche", "Ghizer", "Astore", "Diamer", "Shigar",
  ],
  "Azad Jammu & Kashmir": [
    "Muzaffarabad", "Mirpur", "Rawalakot", "Kotli", "Bhimber", "Bagh", "Neelum",
  ],
  "Islamabad Capital Territory": ["Islamabad"],
};

export const ALL_PAKISTAN_CITIES: { city: string; province: PakistanProvince }[] = Object.entries(
  PAKISTAN_CITIES_BY_PROVINCE,
).flatMap(([province, cities]) => cities.map((city) => ({ city, province: province as PakistanProvince })));
