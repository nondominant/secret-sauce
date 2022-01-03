import {useEffect, useState} from "react"

const ConnectToPhantom = () => {
  const [phantom, setPhantom] = useState(null);
  const [connected, setConnected] = useState(false);

  const connectHandler = () => {
    phantom?.connect();
  };

  const disconnectHandler = () => {
    console.log("disconnect tirggered");
    phantom?.disconnect();
  }

  useEffect(() => {
    phantom?.on("connect", () => {
      setConnected(true);
    });
    phantom?.on("disconnect", () => {
      setConnected(false);
    });
  }, [phantom])

  useEffect(() => {
    if (window["solana"]?.isPhantom){
      setPhantom(window["solana"]);
    }
  }, []);

  if(phantom) {
    if(connected) {
      return (
        <button
          onClick={disconnectHandler}
          className="py-2 px-4 border border-purple-700 rounded-md text-sm font-medium text-purple-700 whitespace-nowrap hover:bg-purple-200"
        >
        DISCONNECT
        </button>
      );
    }
    return(
      <button
        onClick={connectHandler}
        className="py-2 px-4 border border-purple-700 rounded-md text-sm font-medium text-purple-700 whitespace-nowrap hover:bg-purple-200"
      >
      CONNECT
      </button>
    );
  }

  return (
    <a
      href="https://phantom.app/"
      target="_blank"
      className="py-2 px-4 border border-purple-700 rounded-md text-sm font-medium text-purple-700 whitespace-nowrap hover:bg-purple-200"
    >
    GET PHANTOM
    </a>
  );
};

export default ConnectToPhantom;
