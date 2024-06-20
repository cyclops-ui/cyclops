import React, { useState } from "react";

const INIT = "INIT";
const SUBMITTING = "SUBMITTING";
const ERROR = "ERROR";
const SUCCESS = "SUCCESS";
const formStates = [INIT, SUBMITTING, ERROR, SUCCESS];
const formStyles = {
  id: "clxnbxyqc0003ixgw637o04xb",
  name: "Default",
  formStyle: "inline",
  placeholderText: "you@rock.dev",
  formFont: "Roboto",
  formFontColor: "#000000",
  formFontSizePx: 20,
  buttonText: "Join Newsletter",
  buttonFont: "Roboto",
  buttonFontColor: "#ffffff",
  buttonColor: "#fe8801",
  buttonFontSizePx: 20,
  successMessage: "You rock! 🙌",
  successFont: "Roboto",
  successFontColor: "#ffffff",
  successFontSizePx: 20,
  userGroup: "",
};
const domain = "app.loops.so";

export default function SignUpForm() {
  // testing verification
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState(INIT);
  const [errorMessage, setErrorMessage] = useState("");
  const resetForm = () => {
    setEmail("");
    setFormState(INIT);
    setErrorMessage("");
  };
  const hasRecentSubmission = () => {
    const time = new Date();
    const timestamp = time.valueOf();
    const previousTimestamp = localStorage.getItem("loops-form-timestamp");
    if (
      previousTimestamp &&
      Number(previousTimestamp) + 60 * 1000 > timestamp
    ) {
      setFormState(ERROR);
      setErrorMessage("Too many signups, please try again in a little while");
      return true;
    }
    localStorage.setItem("loops-form-timestamp", timestamp.toString());
    return false;
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    if (formState !== INIT) return;
    if (!isValidEmail(email)) {
      setFormState(ERROR);
      setErrorMessage("Please enter a valid email");
      return;
    }
    if (hasRecentSubmission()) return;
    setFormState(SUCCESS);
    const formBody = `userGroup=${encodeURIComponent(
      formStyles.userGroup
    )}&email=${encodeURIComponent(email)}&mailingLists=`;
    fetch(`https://${domain}/api/newsletter-form/${formStyles.id}`, {
      method: "POST",
      body: formBody,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((res) => [res.ok, res.json(), res])
      .then(([ok, dataPromise, res]) => {
        if (ok) {
          resetForm();
          setFormState(SUCCESS);
        } else {
          dataPromise.then((data) => {
            setFormState(ERROR);
            setErrorMessage(data.message || res.statusText);
            localStorage.setItem("loops-form-timestamp", "");
          });
        }
      })
      .catch((error) => {
        setFormState(ERROR);
        if (error.message === "Failed to fetch") {
          setErrorMessage(
            "Too many signups, please try again in a little while"
          );
        } else if (error.message) {
          setErrorMessage(error.message);
        }
        localStorage.setItem("loops-form-timestamp", "");
      });
  };
  const isInline = formStyles.formStyle === "inline";
  switch (formState) {
    case SUCCESS:
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <p
            style={{
              // fontFamily: `'${formStyles.successFont}', sans-serif`,
              color: formStyles.successFontColor,
              fontSize: `${formStyles.successFontSizePx}px`,
              fontWeight: "600",
            }}
          >
            {formStyles.successMessage}
          </p>
        </div>
      );
    case ERROR:
      return (
        <>
          <SignUpFormError />
          <BackButton />
        </>
      );
    default:
      return (
        <>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: isInline ? "row" : "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            <input
              type="email"
              name="email"
              placeholder={formStyles.placeholderText}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                color: formStyles.formFontColor,
                fontSize: `${formStyles.formFontSizePx}px`,
                margin: isInline ? "0px 10px 10px 0px" : "0px 0px 10px",
                width: "100%",
                maxWidth: "300px",
                minWidth: "100px",
                background: "#FFFFFF",
                border: "1px solid #D1D5DB",
                boxSizing: "border-box",
                boxShadow: "rgba(0, 0, 0, 0.05) 0px 1px 2px",
                borderRadius: "6px",
                padding: "8px 12px",
              }}
            />
            <SignUpFormButton />
          </form>
        </>
      );
  }
  function SignUpFormError() {
    return (
      <div
        style={{
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <p
          style={{
            color: "rgb(185, 28, 28)",
            fontSize: "14px",
          }}
        >
          {errorMessage || "Oops! Something went wrong, please try again"}
        </p>
      </div>
    );
  }
  function BackButton() {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <button
        style={{
          color: "#6b7280",
          font: "14px",
          margin: "10px auto",
          textAlign: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textDecoration: isHovered ? "underline" : "none",
        }}
        onMouseOut={() => setIsHovered(false)}
        onMouseOver={() => setIsHovered(true)}
        onClick={resetForm}
      >
        &larr; Back
      </button>
    );
  }
  function SignUpFormButton() {
    return (
      <button
        type="submit"
        style={{
          background: formStyles.buttonColor,
          fontSize: `${formStyles.buttonFontSizePx}px`,
          color: formStyles.buttonFontColor,
          width: isInline ? "min-content" : "100%",
          maxWidth: "300px",
          whiteSpace: isInline ? "nowrap" : "normal",
          height: "38px",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          padding: "9px 17px",
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
          borderRadius: "6px",
          textAlign: "center",
          fontStyle: "normal",
          fontWeight: 800,
          lineHeight: "20px",
          border: "none",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        {formState === SUBMITTING ? "Please wait..." : formStyles.buttonText}
      </button>
    );
  }
}

function isValidEmail(email) {
  return /.+@.+/.test(email);
}
