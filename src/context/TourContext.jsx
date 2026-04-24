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
  const driverRef = useRef(null);

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
    if (!stepsRef.current.length) return;

    const waitForElements = () => {
      const allReady = stepsRef.current.every(step =>
        document.querySelector(step.element)
      );

      if (!allReady) {
        setTimeout(waitForElements, 150);
        return;
      }

      const driverObj = driver({
        showProgress: true,
        steps: stepsRef.current,
        onDestroyed: stopTour,
      });

      driverRef.current = driverObj; // ✅ store
      driverObj.drive();
    };

    waitForElements();
  };


  const destroyTour = () => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
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
          title: "Click This Icon",
          description: "Tap Here! And Learn How to Add Friends 🤔",
          showButtons: ['', ''],
        },

        onNext: () => {
          // 👉 open modal when user clicks next
          window.dispatchEvent(new Event("OPEN_INVITE_MODAL"));
        }
      });
    }

    if (type === "firstChat") {

      resetSteps();

      registerStep({
        element: "#StartfirstChat",
        popover: {
          title: "Select a Friend",
          description: "Click on any friend from your list 👥",
          showButtons: ['', ''],

        }
      });

      startTour();
    }


    if (type === "firstChannel") {

      resetSteps();

      registerStep({
        element: "#firstChannel",
        popover: {
          title: "Tap this Icon",
          description: "Create your own channel, just like Telegram 😎",
          showButtons: ['', ''],
        }
      });
      startTour();
    }


    // 👉 future
    if (type === "broadcast") {
      registerStep({
        element: "#broadcastBtn",
        popover: {
          title: "Broadcast",
          description: "Send message to many.",
          showButtons: ['', ''],
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