// const { use } = require("../../routes/user");

function addNewExpense(e) {
  e.preventDefault();
  const form = new FormData(e.target);

  const expenseDetails = {
    expenseamount: form.get("expenseamount"),
    description: form.get("description"),
    category: form.get("category"),
  };
  const token = localStorage.getItem("token");
  console.log("token:", token);
  axios
    .post("http://localhost:3000/expense/addexpense", expenseDetails, {
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
    .delete(`http://localhost:3000/expense/deleteexpense/${expenseid}`, {
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

function removeExpensefromUI(expenseid) {
  const expenseElemId = `expense-${expenseid}`;
  const expenseElement = document.getElementById(expenseElemId);
  if (expenseElement) {
    expenseElement.remove();
  } else {
    console.error(`Element with ID ${expenseElemId} not found.`);
  }
}

function showError(err) {
  document.body.innerHTML += `<div style="color:blue;"> ${err}</div>`;
}

function showPremiumMsg() {
  document.getElementById("rzp-button1").style.display = "none";
  document.getElementById("premiumMessage").innerHTML =
    "You are a Premium user now!";
  document.getElementById(
    "leaderBoardButton"
  ).innerHTML += `<button onclick="getLeaderboard()">Leaderboard</button>`;
}

function parseJwt(token) {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
}

window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const decodeToken = parseJwt(token);
  console.log(decodeToken);
  const ispremiumuser = decodeToken.ispremiumuser;
  if (ispremiumuser) {
    showPremiumMsg();
  }
  axios
    .get("http://localhost:3000/expense/getexpenses", {
      headers: { Authorization: token },
    })
    .then((response) => {
      if (response.status === 200) {
        const loginNameElement = document.getElementById("loginName");
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        if (userDetails) {
          loginNameElement.innerHTML = `${userDetails.name}'s Expense Tracker`;
        }
        response.data.expenses.forEach((expense) => {
          addNewExpensetoUI(expense);
        });
      } else {
        throw new Error();
      }
    });
});

document.getElementById("rzp-button1").onclick = async function (e) {
  const token = localStorage.getItem("token");
  const response = await axios.get(
    "http://localhost:3000/premium/premiummembership",
    { headers: { Authorization: token } }
  );
  console.log(response);
  var options = {
    key: response.data.key_id,
    order_id: response.data.order.id,
    handler: async function (res) {
      try {
        const updateTransactionResponse = await axios.post(
          "http://localhost:3000/premium/updatetransactionstatus",
          {
            order_id: options.order_id,
            payment_id: res.razorpay_payment_id,
          },
          { headers: { Authorization: token } }
        );

        console.log(
          "response from update transaction",
          updateTransactionResponse
        );

        alert("You are a premium user now");
        showPremiumMsg();

        localStorage.setItem("token", updateTransactionResponse.data.token);
        console.log("new token:", updateTransactionResponse.data.token);
      } catch (error) {
        console.error("Error updating transaction status:", error);
      }
    },
  };
  const rzp1 = new Razorpay(options);
  rzp1.open();
  e.preventDefault();

  rzp1.on("payment.failed", function (response) {
    console.log(response);
    alert("something went wrong during the payment");
  });
};

async function getLeaderboard() {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      "http://localhost:3000/premium/leaderboard",
      {
        headers: { Authorization: token },
      }
    );

    if (response.status === 200) {
      displayLeaderboard(response.data);
    } else {
      throw new Error("Failed to fetch leaderboard");
    }
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
  }
}

function displayLeaderboard(leaderboardData) {
  const leaderboardContainer = document.getElementById("leaderBoard");
  leaderboardContainer.innerHTML = "";
  leaderboardData.forEach((user) => {
    const userElement = document.createElement("div");
    userElement.innerHTML = `<p>${user.name}-Total Expenses: ${user.total_expenses}</p>`;
    leaderboardContainer.appendChild(userElement);
  });
}
