"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

// Dummy data
const DUMMY_SHOPS = [
  { id: "1", name: "Trimmly Downtown", address: "123 Main St" },
  { id: "2", name: "Trimmly Uptown", address: "456 Oak Ave" },
  { id: "3", name: "Trimmly Mall", address: "789 Shopping Center" },
];

const DUMMY_BARBERS = [
  { id: "1", name: "Ahmad", specialty: "Classic Cuts", avatar: "A" },
  { id: "2", name: "John", specialty: "Modern Styles", avatar: "J" },
  { id: "3", name: "Mike", specialty: "Beard Expert", avatar: "M" },
  { id: "4", name: "David", specialty: "Kids Specialist", avatar: "D" },
];

const DUMMY_TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
];

const DUMMY_SERVICES = [
  { id: "1", name: "Haircut", price: "RM 25", duration: "30 min" },
  { id: "2", name: "Haircut + Beard", price: "RM 40", duration: "45 min" },
  { id: "3", name: "Beard Trim", price: "RM 15", duration: "20 min" },
  { id: "4", name: "Hair Wash", price: "RM 10", duration: "15 min" },
  { id: "5", name: "Full Service", price: "RM 50", duration: "60 min" },
];

type BookingType = "walk-in" | "booking" | null;

interface FormData {
  type: BookingType;
  name: string;
  phone: string;
  shopId: string;
  barberId: string;
  date: string;
  time: string;
  serviceId: string;
  queueNumber?: number;
}

export default function BookingPage() {
  const params = useParams();
  const shopname = params.shopname as string;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    type: null,
    name: "",
    phone: "+60",
    shopId: "",
    barberId: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    serviceId: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Auto-select shop based on URL shopname
  useEffect(() => {
    const matchedShop = DUMMY_SHOPS.find(
      (shop) => shop.name.toLowerCase().replace(/\s+/g, "-") === shopname?.toLowerCase()
    );
    if (matchedShop) {
      setFormData((prev) => ({ ...prev, shopId: matchedShop.id }));
    }
  }, [shopname]);

  const handleTypeSelect = (type: BookingType) => {
    // Always set today's date as default
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    if (type === "walk-in") {
      // Auto-assign current date for walk-in
      setFormData((prev) => ({ ...prev, type, date: dateStr }));
    } else {
      setFormData((prev) => ({ ...prev, type, date: dateStr }));
    }
    setStep(2);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // If it starts with +60, keep it
    if (cleaned.startsWith('+60')) {
      // Remove the +60 prefix to get just the number
      const number = cleaned.substring(3);
      // Store with +60 prefix
      setFormData((prev) => ({ ...prev, phone: '+60' + number }));
    } else if (cleaned.startsWith('60')) {
      // If it starts with 60, add the +
      const number = cleaned.substring(2);
      setFormData((prev) => ({ ...prev, phone: '+60' + number }));
    } else if (cleaned.startsWith('+')) {
      // If it starts with + but not +60, replace with +60
      const number = cleaned.substring(1).replace(/^60/, '');
      setFormData((prev) => ({ ...prev, phone: '+60' + number }));
    } else {
      // Just numbers, add +60 prefix
      setFormData((prev) => ({ ...prev, phone: '+60' + cleaned }));
    }
  };

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    // Generate queue number for walk-in
    if (formData.type === "walk-in") {
      const queueNumber = Math.floor(Math.random() * 50) + 1; // Random number between 1-50
      setFormData((prev) => ({ ...prev, queueNumber }));
    }
    console.log("Booking submitted:", formData);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setFormData({
      type: null,
      name: "",
      phone: "+60",
      shopId: "",
      barberId: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      serviceId: "",
    });
    setStep(1);
    setIsSubmitted(false);
  };

  const isStep2Valid = () => {
    if (formData.type === "walk-in") {
      return formData.name.trim() !== "" && formData.phone.trim() !== "" && formData.shopId !== "";
    }
    return formData.date !== "" && formData.shopId !== "";
  };

  const isStep3Valid = () => {
    if (formData.type === "booking") {
      return formData.time !== "";
    }
    return true; // Barber is optional for walk-in
  };

  const selectedShop = DUMMY_SHOPS.find((s) => s.id === formData.shopId);
  const selectedBarber = DUMMY_BARBERS.find((b) => b.id === formData.barberId);
  const selectedService = DUMMY_SERVICES.find((s) => s.id === formData.serviceId);

  // Success Screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800 p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-linear-to-r from-blue-600 to-blue-700 dark:from-black dark:to-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
              {formData.type === "walk-in" && formData.queueNumber ? (
                <span className="text-2xl font-bold text-white">#{formData.queueNumber}</span>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
              {formData.type === "walk-in" ? "Walk-in Confirmed!" : "Booking Confirmed!"}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              {formData.type === "walk-in"
                ? "You're all set! Please proceed to the shop."
                : "Your appointment has been scheduled."}
            </p>
            
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 mb-6 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Name</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">{formData.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Shop</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">{selectedShop?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Date</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">
                  {formData.date ? new Date(formData.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "-"}
                </span>
              </div>
              {formData.type === "booking" && formData.time && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Time</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">{formData.time}</span>
                </div>
              )}
              {formData.type === "walk-in" && formData.queueNumber && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Queue Number</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">#{formData.queueNumber}</span>
                </div>
              )}
              {selectedBarber && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Barber</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">{selectedBarber.name}</span>
                </div>
              )}
            </div>

            <button
              onClick={resetForm}
              className="w-full h-12 rounded-full bg-linear-to-r from-zinc-900 to-blue-700 dark:from-black dark:to-blue-800 text-white dark:text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Booking
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          {/* Progress Indicator */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      step > i
                        ? "bg-linear-to-r from-blue-600 to-blue-700 text-white"
                        : step === i
                        ? "bg-linear-to-r from-zinc-900 to-blue-700 dark:from-black dark:to-blue-800 text-white dark:text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {step > i ? (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i
                    )}
                  </div>
                  {i < 5 && (
                    <div
                      className={`w-8 sm:w-12 h-1 mx-1 rounded transition-all ${
                        step > i ? "bg-linear-to-r from-blue-600 to-blue-700 dark:from-black dark:to-blue-800" : step === i ? "bg-linear-to-r from-zinc-900 to-blue-700 dark:from-black dark:to-blue-800" : "bg-zinc-200 dark:bg-zinc-800"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                {step === 1 && "Choose Type"}
                {step === 2 && (formData.type === "walk-in" ? "Your Details" : "Select Date & Shop")}
                {step === 3 && (formData.type === "walk-in" ? "Select Service" : "Choose Barber")}
                {step === 4 && (formData.type === "walk-in" ? "Choose Barber" : "Select Service")}
                {step === 5 && "Confirm"}
              </span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-900 p-6 sm:p-8">
            {/* Step 1: Choose Type */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
                    Welcome to {selectedShop?.name || shopname?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Trimmly'}!
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400">How would you like to proceed?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleTypeSelect("walk-in")}
                    className="group relative p-6 rounded-xl shadow-md dark:bg-zinc-950 dark:border dark:border-zinc-800/30 transition-all text-left"
                  >
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 transition-colors">
                      <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-1">Walk-in</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Join the queue now</p>
                  </button>

                  <button
                    onClick={() => handleTypeSelect("booking")}
                    className="group relative p-6 rounded-xl shadow-md dark:bg-zinc-950 dark:border dark:border-zinc-800/30 transition-all text-left"
                  >
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 transition-colors">
                      <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-1">Book Appointment</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Schedule for later</p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Details (Walk-in) or Date & Shop (Booking) */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
                    {formData.type === "walk-in" ? "Your Details" : "Select Date & Shop"}
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {formData.type === "walk-in"
                      ? "Please enter your information"
                      : "Choose when and where"}
                  </p>
                </div>

                <div className="space-y-4">
                  {formData.type === "booking" && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => handleInputChange("date", e.target.value)}
                        className="w-full h-12 px-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 dark:text-zinc-200"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Shop</label>
                    <select
                      value={formData.shopId}
                      onChange={(e) => handleInputChange("shopId", e.target.value)}
                      className="w-full h-12 px-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 dark:text-zinc-200 appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                    >
                      <option value="">Select a shop</option>
                      {DUMMY_SHOPS.map((shop) => (
                        <option key={shop.id} value={shop.id}>
                          {shop.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.type === "walk-in" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Enter your name"
                          className="w-full h-12 px-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Phone Number</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-900 dark:text-zinc-200 font-medium">+60</span>
                          <input
                            type="tel"
                            value={formData.phone.startsWith('+60') ? formData.phone.substring(3) : formData.phone.replace(/^\+?60?/, '')}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="123456789"
                            className="w-full h-12 pl-14 pr-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={!isStep2Valid()}
                    className="flex-1 h-12 rounded-full bg-linear-to-r from-zinc-900 to-blue-700 dark:from-black dark:to-blue-800 text-white dark:text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Services (walk-in) / Time & Barber (booking) */}
            {step === 3 && (
              <div className="space-y-6">
                {formData.type === "walk-in" ? (
                  <>
                    <div className="text-center">
                      <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
                        Select Service
                      </h1>
                      <p className="text-zinc-500 dark:text-zinc-400">Choose the service you need</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {DUMMY_SERVICES.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => handleInputChange("serviceId", formData.serviceId === service.id ? "" : service.id)}
                          className={`p-4 rounded-xl border-2 shadow-md dark:shadow-lg transition-all text-left ${
                            formData.serviceId === service.id
                              ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-zinc-950"
                              : "border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-zinc-200">{service.name}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{service.duration}</p>
                            </div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-200">{service.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
                        Select Time & Barber
                      </h1>
                      <p className="text-zinc-500 dark:text-zinc-400">Pick a time slot and optionally choose your barber</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Available Time Slots</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {DUMMY_TIME_SLOTS.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleInputChange("time", time)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              formData.time === time
                                ? "bg-linear-to-r from-zinc-900 to-blue-700 dark:from-black dark:to-blue-800 text-white dark:text-white"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Preferred Barber (Optional)</label>
                      <div className="grid grid-cols-2 gap-3">
                        {DUMMY_BARBERS.map((barber) => (
                          <button
                            key={barber.id}
                            onClick={() => handleInputChange("barberId", formData.barberId === barber.id ? "" : barber.id)}
                            className={`p-4 rounded-xl border-2 shadow-md dark:shadow-lg transition-all text-left ${
                              formData.barberId === barber.id
                                ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-zinc-950"
                                : "border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                  formData.barberId === barber.id
                                    ? "bg-linear-to-r from-zinc-900 to-blue-700 dark:from-black dark:to-blue-800 text-white dark:text-white"
                                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                                }`}
                              >
                                {barber.avatar}
                              </div>
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-200">{barber.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{barber.specialty}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={formData.type === "walk-in" ? !formData.serviceId : (!isStep3Valid())}
                    className="flex-1 h-12 rounded-full bg-linear-to-r from-zinc-900 to-blue-700 dark:from-black dark:to-blue-800 text-white dark:text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Barber (walk-in) / Services (booking) */}
            {step === 4 && (
              <div className="space-y-6">
                {formData.type === "walk-in" ? (
                  <>
                    <div className="text-center">
                      <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
                        Choose Barber
                      </h1>
                      <p className="text-zinc-500 dark:text-zinc-400">Optional - or skip to join any available barber</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Select Barber (Optional)</label>
                      <div className="grid grid-cols-2 gap-3">
                        {DUMMY_BARBERS.map((barber) => (
                          <button
                            key={barber.id}
                            onClick={() => handleInputChange("barberId", formData.barberId === barber.id ? "" : barber.id)}
                            className={`p-4 rounded-xl border-2 shadow-md dark:shadow-lg transition-all text-left ${
                              formData.barberId === barber.id
                                ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-zinc-950"
                                : "border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                  formData.barberId === barber.id
                                    ? "bg-linear-to-r from-zinc-900 to-blue-700 dark:from-black dark:to-blue-800 text-white dark:text-white"
                                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                                }`}
                              >
                                {barber.avatar}
                              </div>
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-200">{barber.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{barber.specialty}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handlePrevStep}
                        className="flex-1 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNextStep}
                        className="flex-1 h-12 rounded-full bg-linear-to-r from-zinc-900 to-blue-700 dark:from-black dark:to-blue-800 text-white dark:text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      >
                        {!formData.barberId ? "I don't mind" : "Continue"}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
                        Select Service
                      </h1>
                      <p className="text-zinc-500 dark:text-zinc-400">Choose the service you need</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {DUMMY_SERVICES.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => handleInputChange("serviceId", formData.serviceId === service.id ? "" : service.id)}
                          className={`p-4 rounded-xl border-2 shadow-md dark:shadow-lg transition-all text-left ${
                            formData.serviceId === service.id
                              ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-zinc-950"
                              : "border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-zinc-200">{service.name}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{service.duration}</p>
                            </div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-200">{service.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Enter your name"
                          className="w-full h-12 px-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Phone Number</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-900 dark:text-zinc-200 font-medium">+60</span>
                          <input
                            type="tel"
                            value={formData.phone.startsWith('+60') ? formData.phone.substring(3) : formData.phone.replace(/^\+?60?/, '')}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="123456789"
                            className="w-full h-12 pl-14 pr-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handlePrevStep}
                        className="flex-1 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNextStep}
                        disabled={!formData.serviceId || !formData.name || !formData.phone}
                        className="flex-1 h-12 rounded-full bg-linear-to-r from-zinc-900 to-blue-700 dark:from-black dark:to-blue-800 text-white dark:text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 5: Booking Summary */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-200 mb-2 tracking-tight">
                    {formData.type === "walk-in" ? "Confirm Walk-in" : "Booking Summary"}
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Review your information
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-3">Booking Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Type</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200 capitalize">{formData.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Shop</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">{selectedShop?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Date</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">
                      {formData.date
                        ? new Date(formData.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </span>
                  </div>
                  {formData.type === "booking" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Time</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-200">{formData.time || "-"}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Service</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">{selectedService?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Barber</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">{selectedBarber?.name || "Any Available"}</span>
                  </div>
                  {formData.name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Name</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-200">{formData.name}</span>
                    </div>
                  )}
                  {formData.phone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Phone</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-200">{formData.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.phone}
                    className="flex-1 h-12 rounded-full bg-linear-to-r from-zinc-900 to-blue-700 dark:from-black dark:to-blue-800 text-white dark:text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm {formData.type === "walk-in" ? "Walk-in" : "Booking"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-20">
          {/* Light mode logo */}
          <Image
            src="/logo-light-full.png"
            alt="Trimmly"
            width={220}
            height={64}
            className="h-14 w-auto dark:hidden"
            priority
          />
          {/* Dark mode logo */}
          <Image
            src="/logo-dark-full.png"
            alt="Trimmly"
            width={220}
            height={64}
            className="h-14 w-auto hidden dark:block"
            priority
          />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">© 2024-2026 Trimmly Inc.</p>
        </div>
      </div>
    </footer>
  );
}
