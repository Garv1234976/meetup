import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "../../context/TourContext";

export default function TourPrompt() {
    const { showTourPrompt, closeTourPrompt, startTour,startTourByType } = useTour();

    

    const skipTour = () => {
        closeTourPrompt();
    };

    
const handleStart = () => {
  startTourByType("addFriend");
};

    return (
        <AnimatePresence>
           {showTourPrompt && (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 20 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.3 }}
      className="fixed  top-0 left-1/2 -translate-x-1/2 z-[9999]"
    >
       <div className="bg-white w-70 sm:w-full shadow-xl border border-gray-200 rounded-xl px-4 py-3 flex flex-col  gap-4">
        
        <div className="flex items-center  gap-3">
          <div>
          <p className="text-sm font-semibold text-gray-800">
            Take a quick tour?
          </p>
        </div>
        <div className="flex ">
          <button
            onClick={skipTour}
            className="text-xs px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            Skip
          </button>

        </div>
        </div>

       <div className="grid grid-cols-1 gap-2">

         <div className="flex items-baseline gap-2">
          <p className="text-xs text-gray-500">
            Learn how to add friends and use features.
          </p>
          <button
            onClick={() => startTourByType("addFriend")}
            className="text-xs px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            Start
          </button>
        </div>

         {/* <div className="flex items-baseline gap-2 justify-between">
          <p className="text-xs text-gray-500">
            Learn How to Broadcast your  message.
          </p>
          <button
            onClick={handleStart}
            className="text-xs px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            Start
          </button>
        </div>

         <div className="flex items-baseline gap-2 justify-between">
          <p className="text-xs text-gray-500">
            Learn How to Create Channel.
          </p>
          <button
            onClick={startTour}
            className="text-xs px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            Start
          </button>
        </div> */}
        

       </div>
      {/* <div className="flex items-center justify-between px-2 font-semibold text-xs">
          <span>
          Complete
        </span>
        <span>1/3</span>
      </div> */}
      </div>
    
    </motion.div>
  )}
        </AnimatePresence>
    );
}