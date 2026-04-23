import { Portfolio } from "@/components/Portfolio";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full flex-col">
      <div className="flex flex-1 items-center justify-center py-8">
        <Portfolio />
      </div>
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
        <Footer />
      </div>
    </div>
  );
}
