let expenses = [];
    let members = [];
    let currentBalances = {};
    let currentSettlements = [];

    function setMembers() {
      const numMembers = document.getElementById("numMembers").value;
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
        .map(input => input.value.trim())
        .filter(name => name);
      members.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      });
      document.getElementById("expenseInputSection").style.display = "block";
    }

    function addExpenseInput() {
      const div = document.createElement("div");
      div.style.marginBottom = "15px";
          let html = `
        <input type='text' placeholder='Enter description' class='expenseDesc'> 
        <input type='number' placeholder='Enter amount' min='0' class='expenseAmount'>
        <div class='shared-checkboxes'>
          <label>Share with:</label>
      `;
      members.forEach(member => {
        html += `<label>${member} <input type='checkbox' class='shareCheckbox' value='${member}' checked></label>`;
      });
      html += `</div>`;
      div.innerHTML = html;
      
      document.getElementById("expenseInputs").appendChild(div);
    }

    function addExpense() {
      const name = document.getElementById("name").value;
      const expenseContainers = document.querySelectorAll("#expenseInputs > div");
      
      expenseContainers.forEach(container => {
        const desc = container.querySelector(".expenseDesc").value || "No Description";
        const amount = parseFloat(container.querySelector(".expenseAmount").value) || 0;
        const checkboxes = container.querySelectorAll(".shareCheckbox:checked");
        
        const sharedWith = Array.from(checkboxes).map(cb => cb.value);
        
        if (amount > 0) {
          expenses.push({ 
            name, 
            description: desc, 
            amount: amount,
            sharedWith 
          });
        }
      });
      
      updateExpenseSheet();
      document.getElementById("expenseInputs").innerHTML = "";
    }

    function updateExpenseSheet() {
      const table = document.getElementById("expenseSheet");
      const screenshotTable = document.getElementById("screenshot-expenseSheet");
      table.innerHTML = "";
      screenshotTable.innerHTML = "";
      
      expenses.forEach((expense, index) => {
        const sharedList = expense.sharedWith.map(name => 
          `<span>${name}</span>`
        ).join("");
        
        
        table.innerHTML += `<tr>
          <td>${expense.name}</td>
          <td>${expense.description}</td>
          <td>${expense.amount.toFixed(2)}</td>
          <td><div class="shared-with">${sharedList}</div></td>
          <td><button onclick="removeExpense(${index})">Remove</button></td>
        </tr>`;
        
       
        screenshotTable.innerHTML += `<tr>
          <td>${expense.name}</td>
          <td>${expense.description}</td>
          <td>${expense.amount.toFixed(2)}</td>
          <td><div class="shared-with">${sharedList}</div></td>
        </tr>`;
      });
    }

    function removeExpense(index) {
      expenses.splice(index, 1);
      updateExpenseSheet();
    }

    function calculateSplit() {
      const totalExpenses = {};
      const tripExpenses = {};  
      members.forEach(member => {
        totalExpenses[member] = 0;
        tripExpenses[member] = 0;
      });


      expenses.forEach(expense => {
        totalExpenses[expense.name] += expense.amount;
        
     
        const sharedCount = expense.sharedWith.length;
        if (sharedCount > 0) {
          const perPersonShare = expense.amount / sharedCount;
          expense.sharedWith.forEach(member => {
            tripExpenses[member] += perPersonShare;
          });
        }
      });

      const balanceSheet = document.getElementById("balanceSheet");
      const screenshotBalanceSheet = document.getElementById("screenshot-balanceSheet");
      balanceSheet.innerHTML = "";
      screenshotBalanceSheet.innerHTML = "";
      currentBalances = {};
      
      members.forEach(member => {
        const balance = totalExpenses[member] - tripExpenses[member];
        currentBalances[member] = balance;
        const status = balance === 0 ? "Settled" : balance > 0 ? "Gets back" : "Owes";
        
 
        balanceSheet.innerHTML += `<tr>
          <td>${member}</td>
          <td>$${tripExpenses[member].toFixed(2)}</td>
          <td>$${totalExpenses[member].toFixed(2)}</td>
          <td>$${Math.abs(balance).toFixed(2)}</td>
          <td>${status}</td>
        </tr>`;
        
     
        screenshotBalanceSheet.innerHTML += `<tr>
          <td>${member}</td>
          <td>$${tripExpenses[member].toFixed(2)}</td>
          <td>$${totalExpenses[member].toFixed(2)}</td>
          <td>$${Math.abs(balance).toFixed(2)}</td>
          <td>${status}</td>
        </tr>`;
      });

      currentSettlements = calculateSettlements(currentBalances);
      document.getElementById("downloadBtn").style.display = "block";
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
      let i = 0, j = 0;
      
      while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amount = Math.min(debtor.balance, creditor.balance);
        
        if (amount > 0.01) {
          settlements.push({
            from: debtor.name,
            to: creditor.name,
            amount: amount
          });
          
          debtor.balance -= amount;
          creditor.balance -= amount;
        }
        
        if (debtor.balance < 0.01) i++;
        if (creditor.balance < 0.01) j++;
      }
      
     
      const settlementSheet = document.getElementById("settlementSheet");
      const screenshotSettlementSheet = document.getElementById("screenshot-settlementSheet");
      settlementSheet.innerHTML = "";
      screenshotSettlementSheet.innerHTML = "";
      
      if (settlements.length === 0) {
        settlementSheet.innerHTML = `<tr><td colspan="3">No settlements needed - everyone is balanced!</td></tr>`;
        screenshotSettlementSheet.innerHTML = `<tr><td colspan="3">No settlements needed - everyone is balanced!</td></tr>`;
      } else {
        settlements.forEach(settlement => {
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
      screenshotContainer.style.display = "block";
      
      html2canvas(screenshotContainer, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "bill-splitter-results.png";
        link.href = image;
        link.click();
        screenshotContainer.style.display = "none";
      });
    }
