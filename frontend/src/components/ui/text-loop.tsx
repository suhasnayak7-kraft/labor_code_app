"use client";

import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TextLoopProps {
    children: React.ReactNode[];
    className?: string;
    interval?: number;
}

export function TextLoop({
    children,
    className,
    interval = 2000,
}: TextLoopProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const items = React.Children.toArray(children);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, interval);
        return () => clearInterval(timer);
    }, [items.length, interval]);

    return (
        <div className={cn("relative inline-block overflow-hidden", className)}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={currentIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="whitespace-nowrap"
                >
                    {items[currentIndex]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
