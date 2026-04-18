const samples = [
{
    "id": "1",
    "title": "Pre-Literacy \/ Early Literacy",
    "slug": "pre-literacy-early-literacy",
    "categories": "[\"nursery\"]",
    "departments": "[]",
    "icon": "🔠"
},
{
    "id": "2",
    "title": "Pre-Numeracy \/ Early Numeracy",
    "slug": "pre-numeracy-early-numeracy",
    "categories": "[\"nursery\"]",
    "departments": "[]",
    "icon": "🔢"
},
{
    "id": "3",
    "title": "English Language",
    "slug": "english-language",
    "categories": "[\"nursery\", \"primary\", \"junior\", \"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "📖"
},
{
    "id": "4",
    "title": "Mathematics",
    "slug": "mathematics",
    "categories": "[\"nursery\", \"primary\", \"junior\", \"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "📐"
},
{
    "id": "5",
    "title": "Basic Science",
    "slug": "basic-science",
    "categories": "[\"primary\"]",
    "departments": "[]",
    "icon": "🔬"
},
{
    "id": "6",
    "title": "Basic Science and Technology",
    "slug": "basic-science-and-technology",
    "categories": "[\"primary\", \"junior\"]",
    "departments": "[]",
    "icon": "⚙️"
},
{
    "id": "7",
    "title": "Integrated Science \/ Intermediate Science",
    "slug": "integrated-science-intermediate-science",
    "categories": "[\"junior\"]",
    "departments": "[]",
    "icon": "🔬"
},
{
    "id": "8",
    "title": "Biology",
    "slug": "biology",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "🧬"
},
{
    "id": "9",
    "title": "Chemistry",
    "slug": "chemistry",
    "categories": "[\"senior\"]",
    "departments": "[\"science\"]",
    "icon": "⚗️"
},
{
    "id": "10",
    "title": "Physics",
    "slug": "physics",
    "categories": "[\"senior\"]",
    "departments": "[\"science\"]",
    "icon": "⚛️"
},
{
    "id": "12",
    "title": "Introductory Technology",
    "slug": "introductory-technology",
    "categories": "[\"junior\"]",
    "departments": "[]",
    "icon": "⚙️"
},
{
    "id": "13",
    "title": "Agricultural Science \/ Basic Agriculture",
    "slug": "agricultural-science-basic-agriculture",
    "categories": "[\"primary\", \"junior\", \"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "🌿"
},
{
    "id": "15",
    "title": "Food &amp; Nutrition",
    "slug": "food-amp-nutrition",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "🥪"
},
{
    "id": "16",
    "title": "Catering Craft",
    "slug": "catering-craft",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "👩‍🍳"
},
{
    "id": "18",
    "title": "Social &amp; Citizenship Studies",
    "slug": "social-amp-citizenship-studies",
    "categories": "[\"primary\", \"junior\"]",
    "departments": "[]",
    "icon": "🚸"
},
{
    "id": "19",
    "title": "Nigerian History",
    "slug": "nigerian-history",
    "categories": "[\"primary\", \"junior\", \"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "🇳🇬"
},
{
    "id": "20",
    "title": "Geography",
    "slug": "geography",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "🌍"
},
{
    "id": "21",
    "title": "Yoruba",
    "slug": "yoruba",
    "categories": "[\"primary\", \"junior\", \"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "🌐"
},
{
    "id": "22",
    "title": "French",
    "slug": "french",
    "categories": "[\"primary\", \"junior\", \"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "🌐"
},
{
    "id": "23",
    "title": "Arabic Language",
    "slug": "arabic-language",
    "categories": "[\"primary\", \"junior\", \"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "🌐"
},
{
    "id": "24",
    "title": "Christian Religious Studies (CRS)",
    "slug": "christian-religious-studies-crs",
    "categories": "[\"primary\", \"junior\", \"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "⛪"
},
{
    "id": "25",
    "title": "Islamic Religious Studies (IRS\/Islamic Studies)",
    "slug": "islamic-religious-studies-irsislamic-studies",
    "categories": "[\"primary\", \"junior\", \"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "🕌"
},
{
    "id": "26",
    "title": "Physical &amp; Health Education (PHE)",
    "slug": "physical-amp-health-education-phe",
    "categories": "[\"primary\", \"junior\"]",
    "departments": "[]",
    "icon": "🤸"
},
{
    "id": "27",
    "title": "Music \/ Basic Music",
    "slug": "music-basic-music",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "🎼"
},
{
    "id": "28",
    "title": "Visual Arts \/ Fine Arts",
    "slug": "visual-arts-fine-arts",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "🎨"
},
{
    "id": "29",
    "title": "Cultural &amp; Creative Arts",
    "slug": "cultural-amp-creative-arts",
    "categories": "[\"primary\", \"junior\"]",
    "departments": "[]",
    "icon": "🧶"
},
{
    "id": "31",
    "title": "Basic Digital Literacy\/ICT",
    "slug": "basic-digital-literacyict",
    "categories": "[\"primary\"]",
    "departments": "[]",
    "icon": "🖥️"
},
{
    "id": "95",
    "title": "Business Studies",
    "slug": "business-studies",
    "categories": "[\"junior\"]",
    "departments": "[]",
    "icon": "💹"
},
{
    "id": "96",
    "title": "Accounting",
    "slug": "accounting",
    "categories": "[\"senior\"]",
    "departments": "[\"commercials\"]",
    "icon": "🧾"
},
{
    "id": "112",
    "title": "Commerce",
    "slug": "commerce",
    "categories": "[\"senior\"]",
    "departments": "[\"commercials\"]",
    "icon": "📈"
},
{
    "id": "133",
    "title": "Economics",
    "slug": "economics",
    "categories": "[\"senior\"]",
    "departments": "[\"commercials\"]",
    "icon": "📉"
},
{
    "id": "137",
    "title": "Marketing",
    "slug": "marketing",
    "categories": "[\"senior\"]",
    "departments": "[\"commercials\"]",
    "icon": "💹"
},
{
    "id": "143",
    "title": "Further Mathematics",
    "slug": "further-mathematics",
    "categories": "[\"senior\"]",
    "departments": "[\"science\"]",
    "icon": "📐"
},
{
    "id": "145",
    "title": "Technical Drawing",
    "slug": "technical-drawing",
    "categories": "[\"senior\"]",
    "departments": "[\"science\"]",
    "icon": "📝"
},
{
    "id": "147",
    "title": "Woodwork \/ Carpentry",
    "slug": "woodwork-carpentry",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "🪚"
},
{
    "id": "166",
    "title": "Beauty &amp; Cosmetology",
    "slug": "beauty-amp-cosmetology",
    "categories": "[\"junior\", \"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "💅"
},
{
    "id": "169",
    "title": "Horticulture &amp; Crop production",
    "slug": "horticulture-amp-crop-production",
    "categories": "[\"junior\", \"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "🌽"
},
{
    "id": "173",
    "title": "Animal Husbandry \/ Livestock Management",
    "slug": "animal-husbandry-livestock-management",
    "categories": "[\"junior\", \"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "🐄"
},
{
    "id": "175",
    "title": "Fisheries",
    "slug": "fisheries",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "🐟"
},
{
    "id": "177",
    "title": "Home Management",
    "slug": "home-management",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "🏠"
},
{
    "id": "185",
    "title": "Practical\/Vocational Studies",
    "slug": "practicalvocational-studies",
    "categories": "[\"primary\", \"junior\"]",
    "departments": "[]",
    "icon": "🛠️"
},
{
    "id": "186",
    "title": "Pre-vocational Studies",
    "slug": "pre-vocational-studies",
    "categories": "[\"primary\"]",
    "departments": "[]",
    "icon": "🪛"
},
{
    "id": "199",
    "title": "Government",
    "slug": "government",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "⚖️"
},
{
    "id": "227",
    "title": "Home Economics",
    "slug": "home-economics",
    "categories": "[\"primary\", \"junior\"]",
    "departments": "[]",
    "icon": "🏡"
},
{
    "id": "253",
    "title": "Early Childhood Play & Motor Skills",
    "slug": "early-childhood-play-motor-skills",
    "categories": "[\"nursery\"]",
    "departments": "[]",
    "icon": "🤹"
},
{
    "id": "255",
    "title": "Stories & Rhymes \/ Pre-reading Activities",
    "slug": "stories-rhymes-pre-reading-activities",
    "categories": "[\"nursery\"]",
    "departments": "[]",
    "icon": "📚"
},
{
    "id": "256",
    "title": "Outdoor Play & Gross Motor Skills",
    "slug": "outdoor-play-gross-motor-skills",
    "categories": "[\"nursery\"]",
    "departments": "[]",
    "icon": "🤹"
},
{
    "id": "257",
    "title": "Handwriting Prep",
    "slug": "handwriting-prep",
    "categories": "[\"nursery\", \"primary\"]",
    "departments": "[]",
    "icon": "📝"
},
{
    "id": "260",
    "title": "Numeracy Games &amp; Practical Arithmetic",
    "slug": "numeracy-games-amp-practical-arithmetic",
    "categories": "[\"nursery\", \"primary\"]",
    "departments": "[]",
    "icon": "🧮"
},
{
    "id": "267",
    "title": "Role Play \/ Social Skills",
    "slug": "role-play-social-skills",
    "categories": "[\"nursery\", \"primary\"]",
    "departments": "[]",
    "icon": "🎬"
},
{
    "id": "269",
    "title": "Play-based Science Explorations",
    "slug": "play-based-science-explorations",
    "categories": "[\"nursery\", \"primary\"]",
    "departments": "[]",
    "icon": ""
},
{
    "id": "275",
    "title": "Remedial Literacy \/ Learning Support",
    "slug": "remedial-literacy-learning-support",
    "categories": "[\"primary\", \"junior\", \"senior\"]",
    "departments": "[]",
    "icon": ""
},
{
    "id": "311",
    "title": "Literature-In-English",
    "slug": "literature-in-english",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "📜"
},
{
    "id": "312",
    "title": "Igbo",
    "slug": "igbo",
    "categories": "[\"primary\", \"junior\", \"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "🌐"
},
{
    "id": "313",
    "title": "Hausa",
    "slug": "hausa",
    "categories": "[\"primary\", \"junior\", \"senior\"]",
    "departments": "[\"arts\"]",
    "icon": "🌐"
},
{
    "id": "314",
    "title": "Digital Technologies \/ ICT",
    "slug": "digital-technologies-ict",
    "categories": "[\"junior\", \"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "🖥️"
},
{
    "id": "315",
    "title": "Solar Photovoltaic installation &amp; maintenance",
    "slug": "solar-photovoltaic-installation-amp-maintenance",
    "categories": "[\"junior\", \"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "💡"
},
{
    "id": "316",
    "title": "Fashion design &amp; garment making",
    "slug": "fashion-design-amp-garment-making",
    "categories": "[\"junior\", \"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "👘"
},
{
    "id": "317",
    "title": "Computer hardware &amp; GSM repair",
    "slug": "computer-hardware-amp-gsm-repair",
    "categories": "[\"junior\", \"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "⌨️"
},
{
    "id": "318",
    "title": "Civic Education \/ Citizenship Studies",
    "slug": "civic-education-citizenship-studies",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "⚖️"
},
{
    "id": "319",
    "title": "Physical Education",
    "slug": "physical-education",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "🤸"
},
{
    "id": "320",
    "title": "Health Education",
    "slug": "health-education",
    "categories": "[\"senior\"]",
    "departments": "[\"arts\", \"commercials\", \"science\"]",
    "icon": "⛑️"
}
]

export const eduka_subjects = {"pre-literacy-early-literacy":"🔠","pre-numeracy-early-numeracy":"🔢","english-language":"📖","mathematics":"📐","basic-science":"🔬","basic-science-and-technology":"⚙️","integrated-science-intermediate-science":"🔬","biology":"🧬","chemistry":"⚗️","physics":"⚛️","introductory-technology":"⚙️","agricultural-science-basic-agriculture":"🌿","food-amp-nutrition":"🥪","catering-craft":"👩‍🍳","social-amp-citizenship-studies":"🚸","nigerian-history":"🇳🇬","geography":"🌍","yoruba":"🌐","french":"🌐","arabic-language":"🌐","christian-religious-studies-crs":"⛪","islamic-religious-studies-irsislamic-studies":"🕌","physical-amp-health-education-phe":"🤸","music-basic-music":"🎼","visual-arts-fine-arts":"🎨","cultural-amp-creative-arts":"🧶","basic-digital-literacyict":"🖥️","business-studies":"💹","accounting":"🧾","commerce":"📈","economics":"📉","marketing":"💹","further-mathematics":"📐","technical-drawing":"📝","woodwork-carpentry":"🪚","beauty-amp-cosmetology":"💅","horticulture-amp-crop-production":"🌽","animal-husbandry-livestock-management":"🐄","fisheries":"🐟","home-management":"🏠","practicalvocational-studies":"🛠️","pre-vocational-studies":"🪛","government":"⚖️","home-economics":"🏡","early-childhood-play-motor-skills":"🤹","stories-rhymes-pre-reading-activities":"📚","outdoor-play-gross-motor-skills":"🤹","handwriting-prep":"📝","numeracy-games-amp-practical-arithmetic":"🧮","role-play-social-skills":"🎬","play-based-science-explorations":"","remedial-literacy-learning-support":"","literature-in-english":"📜","igbo":"🌐","hausa":"🌐","digital-technologies-ict":"🖥️","solar-photovoltaic-installation-amp-maintenance":"💡","fashion-design-amp-garment-making":"👘","computer-hardware-amp-gsm-repair":"⌨️","civic-education-citizenship-studies":"⚖️","physical-education":"🤸","health-education":"⛑️"}
