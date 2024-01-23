function addNewExpense(e) {
  e.preventDefault();
  const form = new FormData(e.target);

  const expenseDetails = {
    expenseamount: form.get("expenseamount"),
    description: form.get("description"),
    category: form.get("category"),
  };
  const token = localStorage.getItem("token");
  console.log(token);
  axios
    .post("http://localhost:3000/user/addexpense", expenseDetails, {
      headers: { Authorization: token },
    })
    .then((response) => {
      if (response.status === 201) {
        addNewExpensetoUI(response.data.expense);
      } else {
        throw new Error("Failed To create new expense");
      }
    })
    .catch((err) => showError(err));
}

window.addEventListener("load", () => {
  const token = localStorage.getItem("token");
  axios
    .get("http://localhost:3000/user/getexpenses", {
      headers: { Authorization: token },
    })
    .then((response) => {
      if (response.status === 200) {
        response.data.expenses.forEach((expense) => {
          addNewExpensetoUI(expense);
        });
      } else {
        throw new Error();
      }
    });
});

function addNewExpensetoUI(expense) {
  const parentElement = document.getElementById("listOfExpenses");
  const expenseElemId = `expense-${expense.id}`;
  parentElement.innerHTML += `
        <li id=${expenseElemId}>
            ${expense.expenseamount} - ${expense.category} - ${expense.description}
            <button onclick='deleteExpense(event, ${expense.id})'>
                Delete Expense
            </button>
        </li>`;

  document.getElementById("expenseamount").value = "";
  document.getElementById("description").value = "";
}

function deleteExpense(e, expenseid) {
  const token = localStorage.getItem("token");
  axios
    .delete(`http://localhost:3000/user/deleteexpense/${expenseid}`, {
      headers: { Authorization: token },
    })
    .then((response) => {
      if (response.status === 204) {
        removeExpensefromUI(expenseid);
      } else {
        throw new Error("Failed to delete");
      }
    })
    .catch((err) => {
      showError(err);
    });
}

function showError(err) {
  document.body.innerHTML += `<div style="color:red;"> ${err}</div>`;
}

function removeExpensefromUI(expenseid) {
  const expenseElemId = `expense-${expenseid}`;
  const expenseElement = document.getElementById(expenseElemId);

  if (expenseElement) {
    expenseElement.remove();
  } else {
    console.error(`Element with ID ${expenseElemId} not found.`);
  }
}
