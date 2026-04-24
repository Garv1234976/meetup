import { createContext, useContext, useRef, useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TourContext = createContext();

export const TourProvider = ({ children }) => {
  const stepsRef = useRef([]);
  const [showTourPrompt, setShowTourPrompt] = useState(true);
  const [activeTour, setActiveTour] = useState(null);
const openTourPrompt = () => setShowTourPrompt(true);
const closeTourPrompt = () => setShowTourPrompt(false);
  

  // ✅ persist state
  useEffect(() => {
    const status = localStorage.getItem("tourActive");

    
  }, []);

  const registerStep = (step) => {
  console.log("📌 Registering step:", step.element);
  stepsRef.current.push(step);
};

  const resetSteps = () => {
    stepsRef.current = [];
  };

  const stopTour = () => {
    localStorage.setItem("tourActive", "false");
   
  };

  const startTour = () => {
    if (!stepsRef.current.length) {
      console.warn("❌ No steps");
      return;
    }

    const waitForElements = () => {
      const validSteps = stepsRef.current.filter(step =>
        document.querySelector(step.element)
      );

      if (validSteps.length !== stepsRef.current.length) {
        setTimeout(waitForElements, 100);
        return;
      }

      const driverObj = driver({
        showProgress: true,
        steps: validSteps,

        onDestroyed: () => {
          stopTour(); // stop permanently
        },
      });

      driverObj.drive();
    };

    waitForElements();
  };

  const startTourByType = (type) => {
  console.log("🚀 Starting tour:", type);

  setActiveTour(type);
  setShowTourPrompt(false); // close modal

  resetSteps();

  if (type === "addFriend") {
    registerStep({
  element: "#addFriend",
  showProgress: false, 
  popover: {
    title: "Add Friends",
    description: "Friends n' Friends, Learn how to add them and Chat instantly. 🤔",
    showButtons: ['', ''],
  },

  onNext: () => {
    // 👉 open modal when user clicks next
    window.dispatchEvent(new Event("OPEN_INVITE_MODAL"));
  }
});
  }

  // 👉 future
  if (type === "broadcast") {
    registerStep({
      element: "#broadcastBtn",
      popover: {
        title: "Broadcast",
        description: "Send message to many",
      },
    });
  }

  startTour();
};

useEffect(() => {
  const waitForEverything = () => {
    const status = localStorage.getItem("tourActive");

    if (status === "false") {
      console.log("⛔ Tour disabled");
      return;
    }

    if (stepsRef.current.length === 0) {
      console.log("⏳ Waiting for steps...");
      setTimeout(waitForEverything, 100);
      return;
    }

    console.log("✅ Steps ready → starting tour");
    startTour();
  };

  waitForEverything();
}, []);

  return (
    <TourContext.Provider
  value={{
    registerStep,
    resetSteps,
    startTour,
    stopTour,
    showTourPrompt,
    openTourPrompt,
    closeTourPrompt,
    startTourByType,   // ✅ ADD THIS
    activeTour, 
  }}
>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => useContext(TourContext);