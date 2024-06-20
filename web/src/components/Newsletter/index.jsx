import SignUpForm from "./SignUpForm";

export default function Newsletter() {
  return (
    <center
      style={{
        width: "80%",
        paddingTop: "10px",
        paddingBottom: "100px",
        margin: "0 auto",
        color: "#FFF",
      }}
    >
      <div>
        <h1>Cyclops Newsletter</h1>
        <p style={{ fontWeight: "600" }}>
          Join our mailing list and stay up-to-date with the latest product
          updates and release notes!
        </p>
      </div>
      <SignUpForm />
    </center>
  );
}
