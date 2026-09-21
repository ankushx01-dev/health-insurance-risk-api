const form = document.querySelector("#prediction-form");
const resultPanel = document.querySelector("#result-panel");
const bmiPreview = document.querySelector("#bmi-preview");
const weightInput = document.querySelector("#weight");
const heightInput = document.querySelector("#height");

function updateBmi() {
  const weight = Number(weightInput.value);
  const height = Number(heightInput.value);
  if (!weight || !height) {
    bmiPreview.textContent = "Your BMI will appear here";
    return;
  }
  const bmi = weight / (height * height);
  const label = bmi < 18.5 ? "underweight" : bmi < 25 ? "healthy range" : bmi < 30 ? "overweight" : "obesity range";
  bmiPreview.textContent = `Calculated BMI ${bmi.toFixed(1)} · ${label}`;
}

weightInput.addEventListener("input", updateBmi);
heightInput.addEventListener("input", updateBmi);

function showResult(result) {
  const probabilities = Object.entries(result.class_probabilities)
    .sort(([, first], [, second]) => second - first)
    .map(([label, value]) => `
      <div class="probability-row">
        <div class="probability-label"><span>${label}</span><span>${Math.round(value * 100)}%</span></div>
        <div class="bar"><span style="width: ${value * 100}%"></span></div>
      </div>`)
    .join("");
  resultPanel.innerHTML = `
    <div class="result-content">
      <span class="step-label">STEP 02 / INSIGHT</span>
      <div class="category">${result.predicted_category}</div>
      <div class="confidence">Model confidence <strong>${Math.round(result.confidence * 100)}%</strong></div>
      <div class="probability-list">${probabilities}</div>
      <button class="new-assessment" type="button" id="reset-button">↺ Start a new assessment</button>
    </div>`;
  document.querySelector("#reset-button").addEventListener("click", () => {
    form.reset();
    updateBmi();
    window.scrollTo({ top: document.querySelector(".workspace").offsetTop - 25, behavior: "smooth" });
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.querySelector("span").textContent = "Analysing your profile...";
  const data = Object.fromEntries(new FormData(form).entries());
  data.age = Number(data.age);
  data.weight = Number(data.weight);
  data.height = Number(data.height);
  data.income_lpa = Number(data.income_lpa);
  data.smoker = data.smoker === "true";
  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "Unable to calculate the estimate.");
    showResult(payload.response);
  } catch (error) {
    resultPanel.innerHTML = `<div class="result-content"><span class="step-label">SOMETHING WENT WRONG</span><h2>We couldn't complete<br /><em>your estimate.</em></h2><p>${error.message}</p><button class="new-assessment" type="button" onclick="window.location.reload()">Try again</button></div>`;
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = "Calculate my outlook";
  }
});
