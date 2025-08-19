"use client";

import Image from "next/image";
import Link from "next/link";
import CartDrawer from "./CartDrawer";
import SearchDrawer from "./SearchDrawer";
import AccountDrawer from "./AccountDrawer";

const Navbar = () => {
  return (
    <div className="navbar bg-white shadow-sm px-4 sm:px-6 md:px-8 lg:px-10 z-10 sticky top-0">
      <Link href="/" className="flex-1">
        <Image
          src="/logo-todo-armazones.png"
          alt="Logo Todo Armazones"
          width={150}
          height={75}
          priority
        />
      </Link>
      <div className="flex flex-row items-center gap-2 flex-none">
        <SearchDrawer />
        <CartDrawer />

        <AccountDrawer />
      </div>
    </div>
  );
};

export default Navbar;
