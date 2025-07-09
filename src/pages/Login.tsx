import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { LogIn, Camera, Heart, Users, MessageCircle, Share } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import TermsModal from "../components/TermsModal";
import PrivacyModal from "../components/PrivacyModal";

const Login = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900">Vremeplov</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Croatian Heritage Photo Archive
          </p>
        </div>

        <Card className="shadow-xl backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Vremeplov.hr</CardTitle>
            <CardDescription>
              Sign in to explore and share Croatian heritage photos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="flex flex-col items-center">
                <Share className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">Share Photos</p>
              </div>
              <div className="flex flex-col items-center">
                <MessageCircle className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-sm text-gray-600">Comment Photos</p>
              </div>
              <div className="flex flex-col items-center">
                <Heart className="h-8 w-8 text-red-600 mb-2" />
                <p className="text-sm text-gray-600">Like Photos</p>
              </div>
              <div className="flex flex-col items-center">
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <p className="text-sm text-gray-600">Tag People</p>
              </div>
            </div>

            <Button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign in with Google
                </div>
              )}
            </Button>

            <div className="text-center text-sm text-gray-500">
              <p>By signing in, you agree to our</p>
              <p>
                <TermsModal>
                  <button className="text-blue-600 hover:underline">Terms of Service</button>
                </TermsModal>
                {' '} and {' '}
                <PrivacyModal>
                  <button className="text-blue-600 hover:underline">Privacy Policy</button>
                </PrivacyModal>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-gray-500">
          <p className="text-sm">
            Preserving Croatian heritage, one memory at a time
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;