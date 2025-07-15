let expenses = [];
let members = [];
let currentBalances = {};
let currentSettlements = [];

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 3000);
}

function updateProgressSteps(currentStep) {
  const steps = document.querySelectorAll(".step");

  steps.forEach((step, index) => {
    step.classList.remove("active", "completed");

    if (index + 1 < currentStep) {
      step.classList.add("completed");
    } else if (index + 1 === currentStep) {
      step.classList.add("active");
    }
  });
}

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active-section");
  });
  document.getElementById(sectionId).classList.add("active-section");
}

function setMembers() {
  const numMembersInput = document.getElementById("numMembers");
  let numMembers = parseInt(numMembersInput.value);

  if (isNaN(numMembers)) {
    showError("Please enter a valid number");
    return;
  }

  if (numMembers < 1) {
    showError("Please enter a positive number of members");
    numMembersInput.value = "";
    return;
  }

  const membersListDiv = document.getElementById("membersList");
  membersListDiv.innerHTML = "";
  members = [];

  for (let i = 0; i < numMembers; i++) {
    membersListDiv.innerHTML += `<input type='text' id='member${i}' placeholder='Enter name'><br>`;
  }
  document.getElementById("membersInput").style.display = "block";
}

function addMembers() {
  const inputs = document.querySelectorAll("#membersList input");
  const select = document.getElementById("name");
  select.innerHTML = "";
  members = Array.from(inputs)
    .map((input) => input.value.trim())
    .filter((name) => name);

  if (members.length === 0) {
    showError("Please enter at least one member name");
    return;
  }

  members.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  
  updateProgressSteps(2);
  showSection("addExpensesSection");
  document.getElementById("expenseInputSection").style.display = "block";
  document.getElementById("expenseSheetSection").style.display = "block";
}

function addExpenseInput() {
  const div = document.createElement("div");
  div.style.marginBottom = "15px";
  let html = `
    <input type='text' placeholder='Enter description' class='expenseDesc'> 
    <input type='number' placeholder='Enter amount' min='0' step="0.01" class='expenseAmount'>
    <div class='shared-checkboxes'>
      <label>Share with:</label>
      <label><input type='checkbox' class='selectAllCheckbox' checked> Select All</label>
  `;

  members.forEach((member) => {
    html += `<label>${member} <input type='checkbox' class='shareCheckbox' value='${member}' checked></label>`;
  });

  html += `</div>`;
  div.innerHTML = html;

  const selectAllCheckbox = div.querySelector(".selectAllCheckbox");
  const shareCheckboxes = div.querySelectorAll(".shareCheckbox");

  
  selectAllCheckbox.addEventListener("change", function (e) {
    shareCheckboxes.forEach((checkbox) => {
      checkbox.checked = e.target.checked;
    });
  });

  // When individual checkboxes are clicked
  shareCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      // Check if all checkboxes are checked
      const allChecked = Array.from(shareCheckboxes).every((cb) => cb.checked);
      selectAllCheckbox.checked = allChecked;
    });
  });

  document.getElementById("expenseInputs").appendChild(div);
}

function addExpense() {
  const name = document.getElementById("name").value;
  const expenseContainers = document.querySelectorAll("#expenseInputs > div");

  if (expenseContainers.length === 0) {
    showError("Please add at least one expense");
    return;
  }

  expenseContainers.forEach((container) => {
    const desc =
      container.querySelector(".expenseDesc").value || "No Description";
    const amount =
      parseFloat(container.querySelector(".expenseAmount").value) || 0;
    const checkboxes = container.querySelectorAll(".shareCheckbox:checked");

    if (isNaN(amount)) {
      showError("Please enter valid amounts for all expenses");
      return;
    }

    const sharedWith = Array.from(checkboxes).map((cb) => cb.value);

    if (sharedWith.length === 0) {
      showError("Each expense must be shared with at least one person");
      return;
    }

    if (amount > 0) {
      expenses.push({
        name,
        description: desc,
        amount: amount,
        sharedWith,
      });
    }
  });

  updateExpenseSheet();
  document.getElementById("expenseInputs").innerHTML = "";
}

function updateExpenseSheet() {
  const table = document.getElementById("expenseSheet");
  const resultsTable = document.getElementById("resultsExpenseSheet");
  const screenshotTable = document.getElementById("screenshot-expenseSheet");
  table.innerHTML = "";
  resultsTable.innerHTML = "";
  screenshotTable.innerHTML = "";

  if (expenses.length === 0) {
    table.innerHTML = `<tr><td colspan="5">No expenses added yet</td></tr>`;
    resultsTable.innerHTML = `<tr><td colspan="4">No expenses added yet</td></tr>`;
    return;
  }

  expenses.forEach((expense, index) => {
    const sharedList = expense.sharedWith
      .map((name) => `<span>${name}</span>`)
      .join("");

    table.innerHTML += `<tr>
      <td>${expense.name}</td>
      <td>${expense.description}</td>
      <td>$${expense.amount.toFixed(2)}</td>
      <td><div class="shared-with">${sharedList}</div></td>
      <td><button class="danger" onclick="removeExpense(${index})">Remove</button></td>
    </tr>`;

    resultsTable.innerHTML += `<tr>
      <td>${expense.name}</td>
      <td>${expense.description}</td>
      <td>$${expense.amount.toFixed(2)}</td>
      <td><div class="shared-with">${sharedList}</div></td>
    </tr>`;

    screenshotTable.innerHTML += `<tr>
      <td>${expense.name}</td>
      <td>${expense.description}</td>
      <td>$${expense.amount.toFixed(2)}</td>
      <td><div class="shared-with">${sharedList}</div></td>
    </tr>`;
  });
}

function removeExpense(index) {
  expenses.splice(index, 1);
  updateExpenseSheet();
}

function calculateSplit() {
  if (expenses.length === 0) {
    showError("Please add expenses before calculating");
    return;
  }

  const totalExpenses = {};
  const tripExpenses = {};
  members.forEach((member) => {
    totalExpenses[member] = 0;
    tripExpenses[member] = 0;
  });

  expenses.forEach((expense) => {
    totalExpenses[expense.name] += expense.amount;

    const sharedCount = expense.sharedWith.length;
    if (sharedCount > 0) {
      const perPersonShare = expense.amount / sharedCount;
      expense.sharedWith.forEach((member) => {
        tripExpenses[member] += perPersonShare;
      });
    }
  });

  const balanceSheet = document.getElementById("balanceSheet");
  const screenshotBalanceSheet = document.getElementById(
    "screenshot-balanceSheet"
  );
  balanceSheet.innerHTML = "";
  screenshotBalanceSheet.innerHTML = "";
  currentBalances = {};

  members.forEach((member) => {
    const balance = totalExpenses[member] - tripExpenses[member];
    currentBalances[member] = balance;
    const status =
      balance === 0 ? "Settled" : balance > 0 ? "Gets back" : "Pays";

    const balanceText =
      balance === 0
        ? `$${Math.abs(balance).toFixed(2)}`
        : balance > 0
        ? `<span style="color:green">+$${Math.abs(balance).toFixed(2)}</span>`
        : `<span style="color:red">-$${Math.abs(balance).toFixed(2)}</span>`;

    balanceSheet.innerHTML += `<tr>
        <td>${member}</td>
        <td>$${tripExpenses[member].toFixed(2)}</td>
        <td>$${totalExpenses[member].toFixed(2)}</td>
        <td>${balanceText}</td>
        <td>${status}</td>
    </tr>`;

    screenshotBalanceSheet.innerHTML += `<tr>
        <td>${member}</td>
        <td>$${tripExpenses[member].toFixed(2)}</td>
        <td>$${totalExpenses[member].toFixed(2)}</td>
        <td>${balanceText}</td>
        <td>${status}</td>
    </tr>`;
  });

  currentSettlements = calculateSettlements(currentBalances);

  
  updateProgressSteps(3);
  showSection("resultsSection");
}

function calculateSettlements(balances) {
  const creditors = [];
  const debtors = [];

  for (let member in balances) {
    const balance = balances[member];
    if (balance > 0.01) {
      creditors.push({ name: member, balance: balance });
    } else if (balance < -0.01) {
      debtors.push({ name: member, balance: -balance });
    }
  }

  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => b.balance - a.balance);

  const settlements = [];
  let i = 0,
    j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.balance, creditor.balance);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount,
      });

      debtor.balance -= amount;
      creditor.balance -= amount;
    }

    if (debtor.balance < 0.01) i++;
    if (creditor.balance < 0.01) j++;
  }

  const settlementSheet = document.getElementById("settlementSheet");
  const screenshotSettlementSheet = document.getElementById(
    "screenshot-settlementSheet"
  );
  settlementSheet.innerHTML = "";
  screenshotSettlementSheet.innerHTML = "";

  if (settlements.length === 0) {
    settlementSheet.innerHTML = `<tr><td colspan="3">No settlements needed - everyone is balanced!</td></tr>`;
    screenshotSettlementSheet.innerHTML = `<tr><td colspan="3">No settlements needed - everyone is balanced!</td></tr>`;
  } else {
    settlements.forEach((settlement) => {
      settlementSheet.innerHTML += `<tr>
        <td>${settlement.from}</td>
        <td>${settlement.to}</td>
        <td>$${settlement.amount.toFixed(2)}</td>
      </tr>`;
      screenshotSettlementSheet.innerHTML += `<tr>
        <td>${settlement.from}</td>
        <td>${settlement.to}</td>
        <td>$${settlement.amount.toFixed(2)}</td>
      </tr>`;
    });
  }

  return settlements;
}

function captureAndDownload() {
  const screenshotContainer = document.getElementById("screenshot-container");
  const originalDisplay = screenshotContainer.style.display;
  screenshotContainer.style.display = "block";

  html2canvas(screenshotContainer, {
    scale: window.devicePixelRatio * 2,
    logging: false,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: 0,
    windowWidth: document.documentElement.offsetWidth,
    windowHeight: document.documentElement.offsetHeight,
  })
    .then((canvas) => {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "bill-splitter-results.png";
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      screenshotContainer.style.display = originalDisplay;
    })
    .catch((err) => {
      console.error("Error capturing image:", err);
      showError("Error generating image. Please try again.");
      screenshotContainer.style.display = originalDisplay;
    });
}

function backToSetup() {
  updateProgressSteps(1);
  showSection("setupMembersSection");
}

function backToExpenses() {
  updateProgressSteps(2);
  showSection("addExpensesSection");
}

function resetApp() {
  expenses = [];
  members = [];
  currentBalances = {};
  currentSettlements = [];

  document.getElementById("numMembers").value = "";
  document.getElementById("membersList").innerHTML = "";
  document.getElementById("membersInput").style.display = "none";
  document.getElementById("expenseInputs").innerHTML = "";
  document.getElementById("expenseSheet").innerHTML = "";
  document.getElementById("resultsExpenseSheet").innerHTML = "";
  document.getElementById("balanceSheet").innerHTML = "";
  document.getElementById("settlementSheet").innerHTML = "";

  updateProgressSteps(1);
  showSection("setupMembersSection");
}
