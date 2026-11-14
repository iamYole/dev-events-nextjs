"use client";

import React, { useState } from "react";

export default function BookEvent() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  }

  return (
    <div id="book-event">
      {submitted ? (
        <p className="text-sm">Thank you for sign in up</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              placeholder="user@email.com"
            />
          </div>
          <button className="button-submit">SUBMIT</button>
        </form>
      )}
    </div>
  );
}
