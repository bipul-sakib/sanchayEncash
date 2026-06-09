// সঞ্চয়পত্রের স্ল্যাব রেট (বছর অনুযায়ী)
const slabRates = {
    "poribar": { 0: 0, 1: 9.50, 2: 10.00, 3: 10.50, 4: 11.00, 5: 11.52 },
    "pensioner": { 0: 0, 1: 9.70, 2: 10.15, 3: 10.65, 4: 11.20, 5: 11.76 },
    "bangladesh": { 0: 0, 1: 9.35, 2: 9.80, 3: 10.25, 4: 10.75, 5: 11.28 },
    "tin_mash": { 0: 0, 1: 9.00, 2: 9.50, 3: 11.04 }
};

// স্কিমগুলোর সর্বোচ্চ মেয়াদ
const maxYears = {
    "poribar": 5,
    "pensioner": 5,
    "bangladesh": 5,
    "tin_mash": 3
};

function calculateEncashment() {
    // ইনপুট ভ্যালু গ্রহণ
    const scheme = document.getElementById("scheme").value;
    const principal = parseFloat(document.getElementById("principal").value);
    const issueDateStr = document.getElementById("issue_date").value;
    const encashmentDateStr = document.getElementById("encashment_date").value;
    const totalInvestment = parseFloat(document.getElementById("total_investment").value) || 0;
    const withdrawnProfit = parseFloat(document.getElementById("withdrawn_profit").value) || 0;

    if (!principal || !issueDateStr || !encashmentDateStr) {
        alert("দয়া করে সব ফিল্ড সঠিকভাবে পূরণ করুন।");
        return;
    }

    // তারিখ হিসাব
    const issueDate = new Date(issueDateStr);
    const encashDate = new Date(encashmentDateStr);

    if (encashDate <= issueDate) {
        alert("ভাঙ্গানোর তারিখ ক্রয়ের তারিখের পরে হতে হবে।");
        return;
    }

    // পূর্ণ বছর নির্ণয় (Completed Years)
    let completedYears = encashDate.getFullYear() - issueDate.getFullYear();
    if (encashDate.getMonth() < issueDate.getMonth() || 
       (encashDate.getMonth() === issueDate.getMonth() && encashDate.getDate() < issueDate.getDate())) {
        completedYears--;
    }

    // মেয়াদের বেশি বছর হলে সর্বোচ্চ বছর ধরবে
    const schemeMaxYear = maxYears[scheme];
    if (completedYears > schemeMaxYear) {
        completedYears = schemeMaxYear;
    }

    // স্ল্যাব রেট বের করা
    const applicableRate = slabRates[scheme][completedYears];

    // ট্যাক্স (TDS) হার নির্ধারণ (৫ লাখের বেশি হলে ১০%, নাহলে ৫%)
    let taxRate = totalInvestment > 500000 ? 10 : 5;
    
    // পেনশনার সঞ্চয়পত্রের ৫ লাখ পর্যন্ত ট্যাক্স মওকুফ (ঐচ্ছিক লজিক)
    if(scheme === "pensioner" && totalInvestment <= 500000) {
        taxRate = 0;
    }

    // গাণিতিক হিসাব
    let grossProfit = 0;
    let taxAmount = 0;
    let netProfit = 0;
    let finalPayable = 0;

    if (completedYears >= 1) {
        // ১ বছর বা তার বেশি হলে হিসাব
        grossProfit = (principal * applicableRate * completedYears) / 100;
        taxAmount = (grossProfit * taxRate) / 100;
        netProfit = grossProfit - taxAmount;
        
        // ইতিমধ্যে টাকা তুলে থাকলে সেটা বাদ যাবে
        finalPayable = (principal + netProfit) - withdrawnProfit;
        document.getElementById("penalty_msg").classList.add("hidden");
    } else {
        // ১ বছরের কম হলে কোনো মুনাফা পাবে না, বরং তোলা মুনাফা আসল থেকে কাটা যাবে
        grossProfit = 0;
        taxAmount = 0;
        netProfit = 0;
        finalPayable = principal - withdrawnProfit;
        document.getElementById("penalty_msg").classList.remove("hidden");
    }

    // ফলাফল UI তে প্রদর্শন করা
    document.getElementById("res_years").innerText = completedYears + " বছর";
    document.getElementById("res_rate").innerText = applicableRate + "%";
    document.getElementById("res_gross_profit").innerText = grossProfit.toFixed(2) + " ৳";
    document.getElementById("res_tax").innerText = taxAmount.toFixed(2) + " ৳ (" + taxRate +"%)";
    document.getElementById("res_net_profit").innerText = netProfit.toFixed(2) + " ৳";
    document.getElementById("res_final_amount").innerText = finalPayable.toFixed(2) + " ৳";

    // রেজাল্ট বক্স দেখানো
    document.getElementById("result_box").classList.remove("hidden");
}
