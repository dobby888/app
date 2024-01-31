function login(e) {
  e.preventDefault();
  console.log(e.target.name);
  const form = new FormData(e.target);
  const loginDetails = {
    email: form.get("email"),
    password: form.get("password"),
  };
  console.log("login details are these:", loginDetails);
  axios
    .post("http://localhost:3000/user/login", loginDetails)
    .then((response) => {
      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userDetails", JSON.stringify(response.data.user));
        localStorage.setItem("userId", response.data.user.id);
        localStorage.setItem("userName", response.data.user.name);
        localStorage.setItem("userEmail", response.data.user.email);
        console.log("token>>>>", response.data.token);
        console.log("UserDetails>>>>>", response.data.user);
        console.log(
          "UserDetails stringify>>>>>>>",
          JSON.stringify(response.data.user)
        );
        window.location.href = "/user/addexpense"; // change the page on successful login
      } else {
        throw new Error("Failed to login");
      }
    })
    .catch((err) => {
      document.body.innerHTML += `<div style="color:green;">${err} <div>`;
    });
}
