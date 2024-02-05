function signup(e) {
  e.preventDefault();
  console.log(e.target.name);
  const form = new FormData(e.target);
  const signupDetails = {
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
  };
  console.log("sign up details are these:", signupDetails);
  axios
    .post("http://localhost:3000/user/signup", signupDetails)
    .then((response) => {
      if (response.status === 201) {
        alert("a new user is created");
        window.location.href = "/user/login";
      } else {
        throw new Error("Failed to login");
      }
    })
    .catch((err) => {
      document.body.innerHTML += `<div style="color:yellow;">${err} <div>`;
    });
}
