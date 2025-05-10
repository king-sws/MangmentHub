"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

interface CardItemProps {
  id: string;
  title: string;
}

export const CardItem = ({ id, title }: CardItemProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true); // Start animation

    setTimeout(async () => {
      await fetch(`/api/card/${id}`, {
        method: "DELETE",
      });
      router.refresh();
    }, 300); // Wait for animation before refresh
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isDeleting ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      className="p-2 mt-2 bg-gray-100 rounded"
    >
      <div className="flex justify-between items-center">
        <span>{title}</span>
        <button
          onClick={handleDelete}
          className="text-red-500 text-xs hover:underline ml-2"
        >
          Delete
        </button>
      </div>
    </motion.div>
  );
};
