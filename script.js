const clock = document.getElementById("clock");
const time = document.getElementById("time");
const amPm = document.getElementById("am-pm");
const switchBtn = document.getElementById("switch-btn");
const settingsBtn = document.getElementById("settings-btn");
const modal = document.getElementById("modal");
const colorPicker = document.getElementById("color-picker");
const closeModalBtn = document.getElementById("close-modal-btn");

let is24Hour = false;

function updateTime() {
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();

  if (!is24Hour) {
    let amPmValue = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    amPm.innerText = amPmValue;
    time.innerText = `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
  } else {
    amPm.innerText = "";
    time.innerText = `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
  }
}

switchBtn.addEventListener("click", () => {
  is24Hour = !is24Hour;
  switchBtn.innerText = is24Hour ? "24" : "12";
});

const colors = [
  {
    name: "yellow",
    hex: "#E2b52b"
  },
  {
    name: "green",
    hex: "#606c38"
  },
  {
    name: "blue",
    hex: "#168aad"
  },
  {
    name: "brown",
    hex: "#bc6c25"
  },
  {
    name: "pink",
    hex: "#ffc9b9"
  },
  {
    name: "purple",
    hex: "#8367c7"
  }
];

colors.forEach(color => {
  const colorOption = document.createElement("div");
  colorOption.classList.add("color-option");
  colorOption.style.backgroundColor = color.hex;
  colorOption.setAttribute("title", color.name);
  colorOption.addEventListener("click", () => {
    clock.style.backgroundColor = color.hex;
    document.body.style.backgroundColor = color.hex;
    modal.style.display = "none";
  });
  colorPicker.appendChild(colorOption);
});

settingsBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

setInterval(updateTime, 1000);