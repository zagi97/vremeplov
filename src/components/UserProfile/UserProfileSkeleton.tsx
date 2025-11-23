// src/components/UserProfile/UserProfileSkeleton.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PageHeader from '@/components/PageHeader';
import Footer from "@/components/Footer";

export const UserProfileSkeleton = () => (
  <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
    <PageHeader title="Vremeplov.hr" />

    <section className="pt-20 sm:pt-24 pb-8 px-4 bg-white flex-1">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left sidebar skeleton */}
          <div className="lg:w-1/3">
            <Card>
              <CardContent className="p-6 text-center">
                {/* Avatar */}
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full animate-pulse" />

                {/* Name */}
                <div className="h-7 w-40 mx-auto bg-gray-200 rounded animate-pulse mb-2" />

                {/* Bio */}
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
                </div>

                {/* Location & joined date */}
                <div className="space-y-2 mb-4">
                  <div className="h-4 w-32 mx-auto bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-28 mx-auto bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Button */}
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>

            {/* Badges skeleton */}
            <Card className="mt-6">
              <CardHeader>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse mx-auto mb-2" />
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right content skeleton */}
          <div className="lg:w-2/3">
            {/* Tabs skeleton */}
            <div className="flex gap-2 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>

            {/* Stats overview skeleton */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Photo grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);
