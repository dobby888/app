function login(e) {
  e.preventDefault();
  console.log(e.target.name);
  const form = new FormData(e.target);
  const loginDetails = {
    email: form.get("email"),
    password: form.get("password"),
  };
  console.log("used login details are these:", loginDetails);
  axios
    .post("http://localhost:3000/user/login", loginDetails)
    .then((response) => {
      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userDetails", JSON.stringify(response.data.user));
        console.log("token>>>>", response.data.token);
        alert("logged in as " + response.data.user.name);
        window.location.href = "/expense/addexpense";
      } else {
        throw new Error("Failed to login");
      }
    })
    .catch((err) => {
      document.body.innerHTML += `<div style="color:green;">${err} <div>`;
    });
}
