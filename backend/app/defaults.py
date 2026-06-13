DEFAULT_LANDING_PAGE = {
    "brand": {
        "name": "phongtzzz",
        "logoText": "phongtzzz",
        "phone": "+84 983 393 954",
        "email": "stayhostelbar@gmail.com",
        "address": "Thon Coc Pang Km0, Du Gia, Ha Giang, Vietnam",
        "facebookUrl": "#",
        "instagramUrl": "#",
        "mapEmbedUrl": "",
    },
    "hero": {
        "title": "phongtzzz",
        "subtitle": "Your sanctuary on the Ha Giang Loop. Where mountain serenity meets authentic local culture.",
        "primaryButtonText": "Explore Rooms",
        "primaryButtonLink": "/rooms",
        "secondaryButtonText": "Book Request",
        "secondaryButtonLink": "/contact",
        "videoUrl": "/videos/hero-coast.mp4",
        "imageUrl": "",
    },
    "marquee": "SERENITY • CULTURE • NATURE • ADVENTURE •",
    "welcome": {
        "eyebrow": "Welcome to phongtzzz",
        "title": "A peaceful base for your Ha Giang journey",
        "paragraphs": [
            "Nestled among mountains and rice fields, phongtzzz is designed for travelers who want comfort, local culture and a slower pace after long riding days.",
            "Wake up to fresh air, share meals with new friends and let our team help you plan the next leg of your loop."
        ],
        "images": ["/images/gallery-landscape-1.jpg", "/images/gallery-guest-1.jpg", "/images/pool-area.jpg"]
    },
    "experiences": {
        "title": "Experience Du Gia",
        "description": "Discover local food, mountain routes, craft culture and quiet corners around the village.",
        "items": [
            {"title": "Mountain Trekking", "description": "Guided walks through rice terraces, waterfalls and hidden viewpoints.", "image": "/images/trekking-path.jpg"},
            {"title": "Local Dining", "description": "Home-style dinners and regional dishes prepared with local ingredients.", "image": "/images/food-dining.jpg"},
            {"title": "Culture & Craft", "description": "Meet local families and learn about traditional weaving and village life.", "image": "/images/culture-weaving.jpg"}
        ]
    },
    "roomsPreview": {
        "title": "Our Rooms",
        "description": "From cozy dorms to private bungalows, find the perfect space for your mountain retreat.",
        "buttonText": "View all rooms"
    },
    "amenities": {
        "title": "Everything You Need",
        "items": [
            {"title": "Free WiFi", "description": "Stay connected throughout the property."},
            {"title": "Breakfast", "description": "Start the day with fresh local food."},
            {"title": "Motorbike Support", "description": "Route advice, parking and local help."},
            {"title": "Laundry", "description": "Simple laundry service for loop travelers."}
        ]
    },
    "testimonials": {
        "title": "Guest Stories",
        "items": [
            {"name": "Mia", "country": "Australia", "rating": 5, "text": "Beautiful location, kind staff and exactly what we needed after a long day riding."},
            {"name": "Lucas", "country": "Germany", "rating": 5, "text": "The family dinner and mountain view made this one of our favorite stays in Vietnam."}
        ]
    },
    "gallery": {
        "title": "Moments at phongtzzz",
        "images": [
            "/images/gallery-dining.jpg",
            "/images/gallery-guest-1.jpg",
            "/images/gallery-guest-2.jpg",
            "/images/gallery-yoga.jpg",
            "/images/gallery-landscape-1.jpg"
        ]
    },
    "contact": {
        "title": "Send a booking request",
        "description": "Tell us your travel dates. We will contact you to confirm room availability and complete the booking.",
        "successTitle": "Request sent!",
        "successMessage": "Thank you. Our homestay will contact you soon to confirm availability."
    },
    "cta": {
        "title": "Ready for your mountain stay?",
        "description": "Send a booking request and our team will get back to you as soon as possible.",
        "buttonText": "Send Booking Request",
        "buttonLink": "/contact"
    }
}

DEFAULT_ROOMS = [
    {
        "name": "Deluxe Double Room",
        "slug": "deluxe-double-room",
        "type": "private",
        "price": 450000,
        "original_price": 550000,
        "capacity": 2,
        "beds": 1,
        "bed_type": "Queen bed",
        "size": "28 m²",
        "description": "A spacious private room with a comfortable queen bed, mountain views and modern amenities.",
        "amenities": ["Free WiFi", "Private bathroom", "Mountain view", "Breakfast included"],
        "highlights": ["Popular", "Private"],
        "images": ["/images/room-deluxe.jpg", "/images/pool-area.jpg", "/images/food-dining.jpg"],
        "is_active": True,
        "sort_order": 1,
    },
    {
        "name": "4-Bed Dorm",
        "slug": "4-bed-dorm",
        "type": "dorm",
        "price": 120000,
        "capacity": 4,
        "beds": 4,
        "bed_type": "Bunk beds",
        "size": "32 m²",
        "description": "A clean and social dorm room for budget travelers looking for comfort and community.",
        "amenities": ["Free WiFi", "Shared bathroom", "Locker", "Breakfast available"],
        "highlights": ["Budget", "Social"],
        "images": ["/images/room-dorm.jpg", "/images/gallery-guest-1.jpg"],
        "is_active": True,
        "sort_order": 2,
    },
    {
        "name": "Mountain Bungalow",
        "slug": "mountain-bungalow",
        "type": "private",
        "price": 650000,
        "capacity": 2,
        "beds": 1,
        "bed_type": "King bed",
        "size": "36 m²",
        "description": "A standalone bungalow with a private balcony and peaceful views across the valley.",
        "amenities": ["Free WiFi", "Private bathroom", "Private balcony", "Breakfast included"],
        "highlights": ["Best view", "Private"],
        "images": ["/images/room-bungalow.jpg", "/images/gallery-landscape-1.jpg"],
        "is_active": True,
        "sort_order": 3,
    },
]
