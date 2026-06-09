// অফিসিয়াল মেয়াদপূর্ব নগদায়ন স্ল্যাব রেট (বাংলাদেশ ব্যাংক গেজেট অনুযায়ী)
const slabRates = {
    "poribar": { 0: 0, 1: 9.50, 2: 10.00, 3: 10.50, 4: 11.00, 5: 11.52 },
    "pensioner": { 0: 0, 1: 9.70, 2: 10.15, 3: 10.65, 4: 11.20, 5: 11.76 },
    "bangladesh": { 0: 0, 1: 9.35, 2: 9.80, 3: 10.25, 4: 10.75, 5: 11.28 },
    "tin_mash": { 0: 0, 1: 9.00, 2: 9.50, 3: 11.04 }
};

const maxYears = {
    "poribar": 5, "pensioner": 5, "bangladesh": 5, "tin_mash": 3
};

function calculateEncashment() {
    // ইনপুট ভ্যালু গ্রহণ
    const scheme = document.getElementById("scheme").value;
    const principal = parseFloat(document.getElementById("principal").value);
    const totalInvestment = parseFloat(document.getElementById("total_investment").value);
    const regularRate = parseFloat(document.getElementById("regular_rate").value);
    const issueDateStr = document.getElementById("issue_date").value;
    const encashmentDateStr = document.getElementById("encashment_date").value;

    // প্রাথমিক ভ্যালিডেশন
    if (isNaN(principal) || isNaN(totalInvestment) || isNaN(regularRate) || !issueDateStr || !encashmentDateStr) {
        alert("দয়া করে সব ফিল্ড সঠিকভাবে পূরণ করুন।");
        return;
    }

    const issueDate = new Date(issueDateStr);
    const encashDate = new Date(encashmentDateStr);

    if (encashDate <= issueDate) {
        alert("ভাঙ্গানোর তারিখ অবশ্যই ক্রয়ের তারিখের পরের কোনো তারিখ হতে হবে।");
        return;
    }

    // ১. মোট অতিক্রান্ত মাস হিসাব করা (উত্তোলিত মুনাফা ট্র্যাকিংয়ের জন্য)
    let totalMonths = (encashDate.getFullYear() - issueDate.getFullYear()) * 12 + (encashDate.getMonth() - issueDate.getMonth());
    if (encashDate.getDate() < issueDate.getDate()) {
        totalMonths--; // যদি বর্তমান মাসের দিন ক্রয়ের দিনের চেয়ে কম হয়, তবে ১ মাস কমবে
    }
    if (totalMonths < 0) totalMonths = 0;

    // ২. সম্পন্ন হওয়া পূর্ণ বছর হিসাব করা
    let completedYears = Math.floor(totalMonths / 12);
    const schemeMaxYear = maxYears[scheme];
    if (completedYears > schemeMaxYear) {
        completedYears = schemeMaxYear;
    }

    // ৩. ইতিমধ্যেই উত্তোলিত মুনাফা হিসাব (ব্যবহারকারীর ইনপুট দেওয়া রেট অনুযায়ী)
    // সূত্র: (আসল টাকা * রেট / ১০০) * (মোট মাস / ১২)
    let withdrawnProfit = 0;
    if (totalMonths > 0) {
        withdrawnProfit = (principal * (regularRate / 100) * totalMonths) / 12;
    }

    // ৪. স্ল্যাব অনুযায়ী নতুন মুনাফা এবং উৎসে কর (TDS) হিসাব
    const applicableRate = slabRates[scheme][completedYears];
    
    // ট্যাক্স রুলস: মোট বিনিয়োগ ৫ লাখের বেশি হলে ১০%, অন্যথায় ৫%
    let taxRate = totalInvestment > 500000 ? 10 : 5;
    
    // বিশেষ নিয়ম: পেনশনার সঞ্চয়পত্রে মোট বিনিয়োগ ৫ লাখ বা তার কম হলে কোনো ট্যাক্স নেই
    if (scheme === "pensioner" && totalInvestment <= 500000) {
        taxRate = 0;
    }

    let grossProfit = 0;
    let taxAmount = 0;
    let netProfit = 0;
    let finalPayable = 0;

    if (completedYears >= 1) {
        // ১ বছর বা তার বেশি সময় পার হলে স্ল্যাব অনুযায়ী মোট গ্রস মুনাফা
        grossProfit = (principal * (applicableRate / 100) * completedYears);
        
        // উৎসে কর (TDS) কর্তন
        taxAmount = (grossProfit * taxRate) / 100;
        
        // ট্যাক্স বাদ দিয়ে প্রকৃত নিট মুনাফা
        netProfit = grossProfit - taxAmount;
        
        // চূড়ান্ত প্রাপ্য টাকা = আসল + নিট প্রাপ্য মুনাফা - ইতিমধ্যেই উত্তোলিত মুনাফা
        finalPayable = (principal + netProfit) - withdrawnProfit;

        document.getElementById("penalty_msg").classList.add("hidden");
        
        // যদি উত্তোলিত মুনাফা প্রাপ্য মুনাফার চেয়ে বেশি হয়ে যায় (যা সাধারণত ঘটে)
        if (withdrawnProfit > netProfit) {
            document.getElementById("adjustment_msg").classList.remove("hidden");
        } else {
            document.getElementById("adjustment_msg").classList.add("hidden");
        }
    } else {
        // ১ বছরের কম সময়ে ভাঙালে কোনো মুনাফা পাওয়া যাবে না (০% রেট)
        grossProfit = 0;
        taxAmount = 0;
        netProfit = 0;
        // জরিমানা হিসেবে আগে তোলা সব মুনাফা আসল টাকা থেকে কেটে নেওয়া হবে
        finalPayable = principal - withdrawnProfit;

        document.getElementById("penalty_msg").classList.remove("hidden");
        document.getElementById("adjustment_msg").classList.add("hidden");
    }

    // ৫. ফলাফল UI-তে প্রদর্শন
    document.getElementById("res_years").innerText = completedYears + " বছর";
    document.getElementById("res_rate").innerText = applicableRate.toFixed(2) + "%";
    document.getElementById("res_principal").innerText = principal.toLocaleString('bn-BD') + " ৳";
    document.getElementById("res_total_time").innerText = totalMonths + " মাস";
    document.getElementById("res_withdrawn_rate").innerText = regularRate;
    document.getElementById("res_withdrawn_profit").innerText = "- " + withdrawnProfit.toLocaleString('bn-BD', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " ৳";
    document.getElementById("res_gross_profit").innerText = grossProfit.toLocaleString('bn-BD', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " ৳";
    document.getElementById("res_tax_rate").innerText = taxRate;
    document.getElementById("res_tax").innerText = "- " + taxAmount.toLocaleString('bn-BD', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " ৳";
    document.getElementById("res_net_profit").innerText = "+ " + netProfit.toLocaleString('bn-BD', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " ৳";
    document.getElementById("res_final_amount").innerText = finalPayable.toLocaleString('bn-BD', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " ৳";

    // রেজাল্ট বক্স দৃশ্যমান করা
    document.getElementById("result_box").classList.remove("hidden");
}
