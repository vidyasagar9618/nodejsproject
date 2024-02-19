
import './App.css';
import { GoogleAuthProvider,signInWithPopup } from "firebase/auth";
import {auth} from './firebase/firebaseconfigartiomn'



function App() {
  const handleGoogle=async (e)=>{
    const provider = await new GoogleAuthProvider();
    try{
      // sign in with google popup
      const result=await signInWithPopup(auth,provider)
      // EXtract the JWt token from the user credential
      const userCredential=result.user;
      const jwtToken=await userCredential.getIdToken();
      console.log(jwtToken)
      return jwtToken


    }catch(error){
      console.log("Error signing in with Goggle:",error)
    }
    

  }
  

  return (
   <button className="button" onClick={handleGoogle}>google sing up</button>
  );
}

export default App;
