import Logo from "../../assets/icons/Logo/Logo.svg?react";

const Header = () => {
  return (
    <header className="fixed top-0 right-0 left-0 z-10">
      <div className="container mx-auto max-w-[834px] p-6">
        <Logo className="w-[59.21px] h-6 text-green-500" />
      </div>
    </header>
  );
};

export default Header;
