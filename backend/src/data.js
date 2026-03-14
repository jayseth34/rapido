export const state = {
  vehicles: [
    { id: "bike", name: "Bike", maxWeight: 5, description: "Fast documents and essentials" },
    { id: "scooter", name: "Scooter", maxWeight: 10, description: "Best for small parcel delivery" },
    { id: "ev-bike", name: "EV Bike", maxWeight: 5, description: "Eco-friendly short distance trips" }
  ],
  zones: [
    { id: "zone-andheri-west", name: "Andheri West", maxRadiusKm: 6, centerLabel: "Andheri Circle" },
    { id: "zone-juhu-vp", name: "Juhu - Vile Parle", maxRadiusKm: 8, centerLabel: "Juhu Signal" }
  ],
  pricingRules: {
    bike: { baseFare: 30, perKm: 10, weightGraceKg: 2, extraWeightCharge: 5 },
    scooter: { baseFare: 35, perKm: 12, weightGraceKg: 2, extraWeightCharge: 6 },
    "ev-bike": { baseFare: 32, perKm: 9, weightGraceKg: 2, extraWeightCharge: 5 }
  },
  partners: [
    {
      id: "partner-1",
      name: "Arjun Patil",
      phone: "9876543210",
      vehicleType: "bike",
      vehicleNumber: "MH02AB1020",
      rating: 4.8,
      verificationStatus: "Approved",
      availability: "online",
      distanceAwayKm: 0.9,
      earningsToday: 950
    },
    {
      id: "partner-2",
      name: "Nikita Sharma",
      phone: "9876500011",
      vehicleType: "scooter",
      vehicleNumber: "MH03CD4432",
      rating: 4.9,
      verificationStatus: "Approved",
      availability: "online",
      distanceAwayKm: 1.4,
      earningsToday: 1180
    },
    {
      id: "partner-3",
      name: "Faizan Shaikh",
      phone: "9765401001",
      vehicleType: "ev-bike",
      vehicleNumber: "MH01EV2301",
      rating: 4.6,
      verificationStatus: "Pending",
      availability: "offline",
      distanceAwayKm: 2.7,
      earningsToday: 0
    }
  ],
  deliveries: [
    {
      id: "DLV-1001",
      customerName: "Aditi Mehra",
      customerPhone: "9898989898",
      pickupAddress: "Lokhandwala Market, Andheri West",
      dropAddress: "Juhu Tara Road, Juhu",
      distanceKm: 5.2,
      weightKg: 3,
      vehicleType: "bike",
      zoneId: "zone-andheri-west",
      price: 87,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      status: "In Transit",
      partnerId: "partner-1",
      createdAt: "2026-03-14T09:30:00.000Z"
    },
    {
      id: "DLV-1002",
      customerName: "Kabir Enterprises",
      customerPhone: "9991122233",
      pickupAddress: "DN Nagar Metro, Andheri",
      dropAddress: "Vile Parle Station East",
      distanceKm: 4.1,
      weightKg: 1.5,
      vehicleType: "ev-bike",
      zoneId: "zone-juhu-vp",
      price: 69,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      status: "Created",
      partnerId: null,
      createdAt: "2026-03-14T11:10:00.000Z"
    }
  ]
};
