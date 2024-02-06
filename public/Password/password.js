function cancelForgotPassword(e) {
  e.preventDefault();
  window.location.href = "/user/login";
}

function getForgotPassword(e) {
  e.preventDefault();
  console.log(e.target.email);
  const form = new FormData(e.target);

  const email = {
    email: form.get("email"),
  };
  const token = localStorage.getItem("token");
  console.log("token:", token);
  axios
    .post("http://localhost:3000/password/forgotpassword", email)
    .then((response) => {
      if (response.status === 200) {
        alert("email sent successfully");
        window.location.href = "/user/login";
      } else {
        throw new Error("Failed To create new expense");
      }
    })
    .catch((err) => showError(err));
}
