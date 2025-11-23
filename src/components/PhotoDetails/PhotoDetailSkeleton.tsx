// src/components/PhotoDetails/PhotoDetailSkeleton.tsx
import React from 'react';
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

export const PhotoDetailSkeleton = () => (
  <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
    <PageHeader title="Vremeplov.hr" />

    <div className="container max-w-5xl mx-auto px-4 py-12 mt-20">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Image skeleton */}
        <div className="w-full h-[500px] bg-gray-200 animate-pulse" />

        {/* Stats skeleton */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Info card skeleton */}
        <div className="m-6">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-6 rounded-t-2xl">
            <div className="h-6 w-48 bg-gray-600 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-600 rounded animate-pulse" />
          </div>

          <div className="p-6 border border-gray-100 rounded-b-2xl">
            {/* Info grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="h-6 w-6 mx-auto bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-16 mx-auto bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-5 w-20 mx-auto bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Description skeleton */}
            <div className="space-y-2 mb-6">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
            </div>
          </div>
        </div>

        {/* Comments skeleton */}
        <div className="p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div>
);
